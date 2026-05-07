import { GoogleGenAI } from '@google/genai';
import { Verse } from '../store';

const GEMINI_API_KEY = (process.env as Record<string, string>).GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada. Adicione-a no arquivo .env');
    }
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}

const PROMPT_TEMPLATE = (reference: string, text: string) => `
Você é um especialista em ensino bíblico para crianças e jovens. Dado o versículo abaixo, gere um conteúdo estruturado para um app de memorização bíblica.

Versículo: "${text}"
Referência: ${reference}

Retorne um JSON válido com os seguintes campos:

{
  "explanation": "Explicação simples e didática do versículo (2-3 frases, linguagem acessível para crianças/jovens)",
  "bookContext": "Breve contexto de onde o versículo se encontra na Bíblia (1-2 frases)",
  "keywords": ["3 a 5 palavras-chave importantes do versículo"],
  "emojiText": "O texto do versículo com algumas palavras substituídas por emojis relevantes (mantenha a maioria das palavras, substitua apenas 3-6 palavras por emojis)",
  "fakeReferences": ["2 referências bíblicas reais que NÃO são esta, mas que tratam de tema similar"]
}

REGRAS:
- Tudo em português brasileiro
- A explanation deve ser fácil de entender, inspiradora e curta
- O bookContext deve situar o leitor no contexto bíblico
- As keywords devem ser palavras presentes no texto do versículo
- O emojiText DEVE substituir 3-6 palavras do versículo por emojis relevantes. NÃO coloque o emoji ao lado da palavra, SUBSTITUA a palavra pelo emoji.
- As fakeReferences devem ser 2 referências REAIS da Bíblia (livro capítulo:versículo) que existam de fato
- Retorne APENAS o JSON, sem markdown, sem explicações adicionais.
`;

/**
 * Gera as palavras embaralhadas a partir do texto do versículo e da referência
 */
function generateScrambled(text: string, reference: string): string[] {
  // Remove pontuação e divide em palavras
  const words = text
    .replace(/[.,;:!?"""''—\-()[\]]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Extrai partes da referência (ex: "1 Samuel 3:1" -> ["1 Samuel", "3", ":", "1"])
  // Regex para capturar: Nome do Livro (pode ter espaços/números), Capítulo, ":", Versículo
  const refMatch = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  const refParts: string[] = [];
  if (refMatch) {
    const [, book, chapter, verse] = refMatch;
    refParts.push(book.replace(/\s+/g, ''), chapter, ":", verse);
  }

  // Combina palavras e partes da referência
  const allElements = [...words, ...refParts];

  // Remove duplicatas mantendo a primeira ocorrência
  const unique = [...new Set(allElements)];

  // Embaralha (Fisher-Yates)
  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// Modelos em ordem de preferência (fallback)
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.0-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview'
];

// Número máximo de rodadas de retry com backoff
const MAX_RETRY_ROUNDS = 5;
// Tempos de espera por rodada (em ms): 5s, 10s, 20s, 40s, 60s
const BACKOFF_DELAYS = [5_000, 10_000, 20_000, 40_000, 60_000];

// Cooldown entre requisições para evitar rate limit
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3_000; // 3s entre requisições

/**
 * Aguarda um tempo antes de continuar (ms)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Garante intervalo mínimo entre requisições
 */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - elapsed);
  }
  lastRequestTime = Date.now();
}

/**
 * Tenta chamar um modelo específico
 */
async function tryModel(genAI: GoogleGenAI, model: string, prompt: string): Promise<{ text?: string; rateLimited?: boolean; error?: any }> {
  try {
    await throttle();
    console.log(`[Gemini] Tentando modelo: ${model}`);
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      },
    });

    const responseText = response.text?.trim() || '';
    if (responseText) {
      console.log(`[Gemini] Sucesso com modelo: ${model}`);
      return { text: responseText };
    }
    return { error: new Error('Resposta vazia do modelo') };
  } catch (err: any) {
    const status = err?.status || err?.error?.code || err?.code;
    const isRateLimit = status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
    console.warn(`[Gemini] Erro com modelo ${model}:`, isRateLimit ? 'Rate limit' : err?.message);
    return { rateLimited: isRateLimit, error: err };
  }
}

/**
 * Tenta gerar conteúdo com fallback entre modelos e retry com backoff exponencial
 */
async function callGeminiWithFallback(prompt: string): Promise<string> {
  const genAI = getAI();
  let lastError: any = null;

  for (let round = 0; round <= MAX_RETRY_ROUNDS; round++) {
    // Se não é a primeira rodada, espera com backoff
    if (round > 0) {
      const delay = BACKOFF_DELAYS[Math.min(round - 1, BACKOFF_DELAYS.length - 1)];
      console.log(`[Gemini] Rate limit — aguardando ${delay / 1000}s (tentativa ${round}/${MAX_RETRY_ROUNDS})...`);
      await sleep(delay);
    }

    // Tenta cada modelo
    let allRateLimited = true;
    for (const model of MODELS) {
      const result = await tryModel(genAI, model, prompt);

      if (result.text) {
        return result.text;
      }

      if (!result.rateLimited) {
        allRateLimited = false;
        lastError = result.error;
        // Erro não é rate limit — não adianta tentar backoff, tenta próximo modelo
      } else {
        lastError = result.error;
      }
    }

    // Se nenhum modelo deu rate limit, não faz sentido retry com backoff
    if (!allRateLimited) {
      break;
    }
  }

  // Se chegou aqui, esgotou todas as tentativas
  const isRateLimitFinal = lastError?.status === 429 || lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED');
  if (isRateLimitFinal) {
    throw new Error('Limite de requisições da IA atingido. Aguarde alguns minutos e tente novamente.');
  }

  throw lastError || new Error('Falha ao gerar conteúdo com IA.');
}

/**
 * Extrai apenas a parte JSON de uma string
 */
function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

/**
 * Gera o conteúdo estruturado de um versículo usando Gemini
 */
export async function generateVerseContent(reference: string, text: string): Promise<Verse> {
  const responseText = await callGeminiWithFallback(PROMPT_TEMPLATE(reference, text));

  // Limpa possíveis markdown wrappers e outros ruídos
  const cleanJson = extractJson(responseText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  let parsed: {
    explanation: string;
    bookContext: string;
    keywords: string[];
    emojiText: string;
    fakeReferences: string[];
  };

  try {
    parsed = JSON.parse(cleanJson);
  } catch (e) {
    console.error('Erro ao parsear resposta do Gemini:', cleanJson);
    throw new Error('Falha ao interpretar resposta da IA. Tente novamente.');
  }

  return {
    reference,
    text,
    explanation: parsed.explanation,
    bookContext: parsed.bookContext,
    keywords: parsed.keywords,
    emojiText: parsed.emojiText,
    scrambled: generateScrambled(text, reference),
    fakeReferences: parsed.fakeReferences,
  };
}

/**
 * Regera o conteúdo com uma variação diferente (mesma estrutura, conteúdo novo)
 */
export async function regenerateVerseContent(reference: string, text: string): Promise<Verse> {
  return generateVerseContent(reference, text);
}

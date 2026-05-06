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

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com os seguintes campos:

{
  "explanation": "Explicação simples e didática do versículo (2-3 frases, linguagem acessível para crianças/jovens)",
  "bookContext": "Breve contexto de onde o versículo se encontra na Bíblia (1-2 frases)",
  "keywords": ["3 a 5 palavras-chave importantes do versículo"],
  "emojiText": "O texto do versículo com as keywords substituídas por emojis relevantes (mantenha a maioria das palavras, substitua apenas 3-6 palavras por emojis)",
  "fakeReferences": ["2 referências bíblicas reais que NÃO são esta, mas que tratam de tema similar"]
}

REGRAS:
- Tudo em português brasileiro
- A explanation deve ser fácil de entender, inspiradora e curta
- O bookContext deve situar o leitor no contexto bíblico
- As keywords devem ser palavras presentes no texto do versículo
- O emojiText DEVE manter a estrutura do versículo original, apenas substituindo as keywords por emojis
- As fakeReferences devem ser referências REAIS da Bíblia (livro capítulo:versículo) que existam de fato
- Retorne SOMENTE o JSON, sem nenhum texto adicional
`;

/**
 * Gera as palavras embaralhadas a partir do texto do versículo
 */
function generateScrambled(text: string): string[] {
  // Remove pontuação e divide em palavras
  const words = text
    .replace(/[.,;:!?"""''—\-()[\]]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Remove duplicatas mantendo a primeira ocorrência
  const unique = [...new Set(words)];

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
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

/**
 * Aguarda um tempo antes de continuar (ms)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tenta gerar conteúdo com fallback entre modelos
 */
async function callGeminiWithFallback(prompt: string): Promise<string> {
  const genAI = getAI();
  let lastError: any = null;

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Tentando modelo: ${model}`);
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.9,
          maxOutputTokens: 1024,
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        console.log(`[Gemini] Sucesso com modelo: ${model}`);
        return responseText;
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.error?.code || err?.code;
      const isRateLimit = status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');

      console.warn(`[Gemini] Erro com modelo ${model}:`, isRateLimit ? 'Rate limit' : err?.message);

      if (isRateLimit && model !== MODELS[MODELS.length - 1]) {
        // Tenta o próximo modelo imediatamente
        continue;
      }

      if (isRateLimit) {
        // Todos os modelos com rate limit — espera e tenta o primeiro novamente
        console.log('[Gemini] Todos os modelos com rate limit. Aguardando 10s...');
        await sleep(10000);
        try {
          const response = await genAI.models.generateContent({
            model: MODELS[0],
            contents: prompt,
            config: { temperature: 0.9, maxOutputTokens: 1024 },
          });
          const text = response.text?.trim() || '';
          if (text) return text;
        } catch {
          // Falhou de novo
        }
        throw new Error('Limite de requisições da IA atingido. Aguarde 1 minuto e tente novamente.');
      }
    }
  }

  throw lastError || new Error('Falha ao gerar conteúdo com IA.');
}

/**
 * Gera o conteúdo estruturado de um versículo usando Gemini
 */
export async function generateVerseContent(reference: string, text: string): Promise<Verse> {
  const responseText = await callGeminiWithFallback(PROMPT_TEMPLATE(reference, text));

  // Limpa possíveis markdown wrappers
  const cleanJson = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
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
    scrambled: generateScrambled(text),
    fakeReferences: parsed.fakeReferences,
  };
}

/**
 * Regera o conteúdo com uma variação diferente (mesma estrutura, conteúdo novo)
 */
export async function regenerateVerseContent(reference: string, text: string): Promise<Verse> {
  return generateVerseContent(reference, text);
}

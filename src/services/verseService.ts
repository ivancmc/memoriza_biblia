import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Verse } from "../store";
import { offlineVerses } from "../data/verses";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const verseSchema = {
  type: Type.OBJECT,
  properties: {
    reference: { type: Type.STRING, description: "Livro Capítulo:Versículo" },
    text: { type: Type.STRING, description: "O texto completo do versículo." },
    explanation: { type: Type.STRING, description: "Uma explicação muito simples e curta para uma criança de 7 anos." },
    bookContext: { type: Type.STRING, description: "Uma frase curta explicando sobre o que é este livro da Bíblia (ex: 'Salmos é um livro de músicas e orações para Deus')." },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 a 5 palavras-chave importantes do versículo"
    },
    emojiText: { type: Type.STRING, description: "O texto do versículo substituindo as palavras-chave por emojis correspondentes (ex: 'Deus' -> '👑', 'amor' -> '❤️'). Mantenha a gramática correta." },
    scrambled: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Todas as palavras do versículo em ordem aleatória"
    },
    fakeReferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 referências parecidas mas incorretas para teste de múltipla escolha"
    }
  },
  required: ["reference", "text", "explanation", "bookContext", "keywords", "emojiText", "scrambled", "fakeReferences"]
};

// Helper: Timeout wrapper
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function generateWithModel(model: string, prompt: string, retries = 1): Promise<Verse> {
  let lastError: any;

  for (let i = 0; i <= retries; i++) {
    try {
      // 12s timeout for better UX (fail fast to try next model)
      const response: GenerateContentResponse = await timeoutPromise(
        ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: verseSchema
          }
        }),
        12000
      );

      let text = response.text;
      if (!text) throw new Error("No response from AI");

      // Clean up markdown code blocks if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text);
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for model ${model}:`, error);
      lastError = error;
      // Short delay before retry
      if (i < retries) await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw lastError;
}

export async function generateVerse(): Promise<Verse> {
  const prompt = `
    Gere um versículo bíblico curto e fácil de memorizar para crianças (em Português do Brasil).
    O versículo deve ser apropriado para crianças de 7 anos.
    Evite versículos muito longos ou complexos.
  `;

  // If offline, immediately return a random offline verse
  if (!navigator.onLine) {
    const randomIndex = Math.floor(Math.random() * offlineVerses.length);
    return offlineVerses[randomIndex];
  }

  try {
    // Try with the latest model first
    return await generateWithModel("gemini-2.5-flash-lite", prompt);
  } catch (error) {
    console.warn("Failed with gemini-2.5-flash-lite, trying fallback model...", error);
    try {
      // Fallback to stable model
      return await generateWithModel("gemini-2.5-flash", prompt);
    } catch (fallbackError) {
      console.error("Error generating verse with both models:", fallbackError);

      // Fallback: Pick a random verse from the offline database
      const randomIndex = Math.floor(Math.random() * offlineVerses.length);
      return offlineVerses[randomIndex];
    }
  }
}

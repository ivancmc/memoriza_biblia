import { Verse } from "../store";
import { offlineVerses } from "../data/verses";
import { supabase } from "./supabase";

export async function generateVerse(excludeReferences: string[] = []): Promise<Verse> {
  try {
    // 1. Try to get a random verse from Supabase first
    let query = supabase
      .from('verses')
      .select('*', { count: 'exact', head: true });

    if (excludeReferences.length > 0) {
      query = query.not('reference', 'in', `(${excludeReferences.map(r => `"${r}"`).join(',')})`);
    }

    const { count, error: countError } = await query;

    if (!countError && count !== null && count > 0) {
      // Pick a random index
      const randomIndex = Math.floor(Math.random() * count);

      let fetchQuery = supabase
        .from('verses')
        .select('*');

      if (excludeReferences.length > 0) {
        fetchQuery = fetchQuery.not('reference', 'in', `(${excludeReferences.map(r => `"${r}"`).join(',')})`);
      }

      const { data, error: fetchError } = await fetchQuery
        .range(randomIndex, randomIndex)
        .single();

      if (!fetchError && data) {
        // Map snake_case from DB to camelCase for the Verse interface
        return {
          reference: data.reference,
          text: data.text,
          explanation: data.explanation,
          bookContext: data.book_context,
          keywords: data.keywords,
          emojiText: data.emoji_text,
          scrambled: data.scrambled,
          fakeReferences: data.fake_references
        };
      }
    }
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
  }

  // 2. Fallback to offlineVerses if Supabase fails or returns nothing
  const filteredVerses = offlineVerses.filter(
    v => !excludeReferences.includes(v.reference)
  );

  const sourceList = filteredVerses.length > 0 ? filteredVerses : offlineVerses;
  const randomIndex = Math.floor(Math.random() * sourceList.length);
  return sourceList[randomIndex];
}

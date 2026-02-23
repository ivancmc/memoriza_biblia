import { Verse } from "../store";
import { offlineVerses } from "../data/verses";

export async function generateVerse(excludeReferences: string[] = []): Promise<Verse> {
  // Filter out verses that are already in the history
  const filteredVerses = offlineVerses.filter(
    v => !excludeReferences.includes(v.reference)
  );

  // If we have filtered verses, pick from them. 
  // Otherwise, fall back to the full list (if everything was already used)
  const sourceList = filteredVerses.length > 0 ? filteredVerses : offlineVerses;

  const randomIndex = Math.floor(Math.random() * sourceList.length);
  return sourceList[randomIndex];
}

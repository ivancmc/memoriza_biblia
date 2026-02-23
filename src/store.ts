import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AchievementId, achievements } from './components/AchievementsModal';

export interface Verse {
  reference: string;
  text: string;
  explanation: string;
  bookContext: string; // Context/Objective of the book
  keywords: string[]; // Words to hide/emphasize
  emojiText: string; // Text with emojis replacing key words
  scrambled: string[]; // Words in random order
  fakeReferences: string[]; // Incorrect references for multiple choice
  isFallback?: boolean;
  notes?: string;
}

interface AppState {
  currentDay: number;
  completedDays: number[];
  currentVerse: Verse | null;
  history: Verse[];
  isLoading: boolean;
  unlockedAchievements: AchievementId[];
  lastUnlockedAchievement: AchievementId | null;
  setCurrentDay: (day: number) => void;
  completeDay: (day: number) => void;
  setVerse: (verse: Verse) => void;
  addToHistory: (verse: Verse) => void;
  setLoading: (loading: boolean) => void;
  resetProgress: () => void;
  updateNotes: (reference: string, notes: string) => void;
  clearLastUnlockedAchievement: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentDay: 1,
      completedDays: [],
      currentVerse: null,
      history: [],
      isLoading: false,
      unlockedAchievements: [],
      lastUnlockedAchievement: null,
      setCurrentDay: (day) => set({ currentDay: day }),
      completeDay: (day) =>
        set((state) => ({
          completedDays: state.completedDays.includes(day)
            ? state.completedDays
            : [...state.completedDays, day],
        })),
      setVerse: (verse) => set({ currentVerse: verse }),
      addToHistory: (verse) =>
        set((state) => {
          const exists = state.history.some((v) => v.reference === verse.reference);
          if (exists) return state;

          const newHistory = [verse, ...state.history];
          const newAchievements = [...state.unlockedAchievements];

          let lastUnlocked: AchievementId | null = null;

          const checkAchievement = (count: number, id: AchievementId) => {
            if (newHistory.length >= count && !newAchievements.includes(id)) {
              newAchievements.push(id);
              lastUnlocked = id;
            }
          };

          checkAchievement(1, '1_verse');
          checkAchievement(5, '5_verses');
          checkAchievement(10, '10_verses');
          checkAchievement(25, '25_verses');

          return { 
            history: newHistory,
            unlockedAchievements: newAchievements,
            lastUnlockedAchievement: lastUnlocked
          };
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      resetProgress: () => set({ currentDay: 1, completedDays: [] }),
      updateNotes: (reference, notes) =>
        set((state) => ({
          history: state.history.map((v) =>
            v.reference === reference ? { ...v, notes } : v
          ),
        })),
      clearLastUnlockedAchievement: () => set({ lastUnlockedAchievement: null }),
    }),
    {
      name: 'memorizakids-storage',
    }
  )
);

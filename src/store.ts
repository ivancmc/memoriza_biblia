import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AchievementId, achievements } from './components/AchievementsModal';
import { offlineVerses } from './data/verses';
import { supabase } from './services/supabase';
import { Session, User } from '@supabase/supabase-js';

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
}

interface AppState {
  currentDay: number;
  completedDays: number[];
  currentVerse: Verse | null;
  history: Verse[];
  isLoading: boolean;
  unlockedAchievements: AchievementId[];
  lastUnlockedAchievement: AchievementId | null;
  user: User | null;
  session: Session | null;
  reminderHour: number | null;
  reminderMinute: number | null;
  setCurrentDay: (day: number) => void;
  completeDay: (day: number) => void;
  setVerse: (verse: Verse) => void;
  addToHistory: (verse: Verse) => void;
  setLoading: (loading: boolean) => void;
  resetProgress: () => void;
  clearLastUnlockedAchievement: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setReminderConfig: (hour: number, minute: number) => void;
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentDay: 1,
      completedDays: [],
      currentVerse: null,
      history: [],
      isLoading: false,
      unlockedAchievements: [],
      lastUnlockedAchievement: null,
      user: null,
      session: null,
      reminderHour: null,
      reminderMinute: null,
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
      clearLastUnlockedAchievement: () => set({ lastUnlockedAchievement: null }),
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setReminderConfig: (hour, minute) => set({ reminderHour: hour, reminderMinute: minute }),
      syncToSupabase: async () => {
        const state = get();
        if (!state.user) return;

        const syncData = {
          id: state.user.id,
          current_day: state.currentDay,
          completed_days: state.completedDays,
          current_verse_ref: state.currentVerse?.reference || null,
          history_refs: state.history.map(v => v.reference),
          unlocked_achievements: state.unlockedAchievements,
          reminder_hour: state.reminderHour,
          reminder_minute: state.reminderMinute,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          updated_at: new Date().toISOString()
        };

        console.log('Pushing sync to Supabase profile. User ID:', state.user.id, 'Verse Ref:', syncData.current_verse_ref);

        const { error } = await supabase.from('profiles').upsert(syncData, { onConflict: 'id' });

        if (error) {
          console.error('Error syncing to Supabase:', error.message, error.details);
        } else {
          console.log('Sync successful for verse:', syncData.current_verse_ref);
        }
      },
      loadFromSupabase: async () => {
        const state = get();
        if (!state.user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', state.user.id)
          .single();

        if (error || !data) return;

        // Fetch full verse objects for the history and current verse
        let history: Verse[] = [];
        let currentVerse: Verse | null = null;

        const refsToFetch = [...(data.history_refs || [])];
        if (data.current_verse_ref) {
          refsToFetch.push(data.current_verse_ref);
        }

        if (refsToFetch.length > 0) {
          const { data: versesData } = await supabase
            .from('verses')
            .select('*')
            .in('reference', refsToFetch);

          if (versesData) {
            const allVerses = [...versesData];

            // Reorder to match history_refs order
            history = (data.history_refs || [])
              .map((ref: string) => {
                const found = allVerses.find((v: any) => v.reference === ref);
                if (found) return {
                  reference: found.reference,
                  text: found.text,
                  explanation: found.explanation,
                  bookContext: found.book_context,
                  keywords: found.keywords,
                  emojiText: found.emoji_text,
                  scrambled: found.scrambled,
                  fakeReferences: found.fake_references,
                };
                // Try to find in offline verses if not in DB
                const offline = offlineVerses.find(ov => ov.reference === ref);
                return offline || null;
              })
              .filter(Boolean) as Verse[];

            if (data.current_verse_ref) {
              const v = allVerses.find((v: any) => v.reference === data.current_verse_ref);
              if (v) {
                currentVerse = {
                  reference: v.reference,
                  text: v.text,
                  explanation: v.explanation,
                  bookContext: v.book_context,
                  keywords: v.keywords,
                  emojiText: v.emoji_text,
                  scrambled: v.scrambled,
                  fakeReferences: v.fake_references,
                };
              } else {
                // Try to find in offline verses if not in DB
                const offline = offlineVerses.find(ov => ov.reference === data.current_verse_ref);
                if (offline) {
                  currentVerse = offline;
                } else if (state.currentVerse?.reference === data.current_verse_ref) {
                  // Keep current one if it matches the reference we are looking for
                  currentVerse = state.currentVerse;
                }
              }
            }
          }
        }

        // If data.current_verse_ref exists but couldn't be loaded, and we already have a verse in state,
        // it might be better to keep the current one than setting it to null.
        const finalCurrentVerse = currentVerse ||
          (data.current_verse_ref === state.currentVerse?.reference ? state.currentVerse : null);

        set({
          currentDay: data.current_day,
          completedDays: data.completed_days,
          currentVerse: finalCurrentVerse,
          unlockedAchievements: data.unlocked_achievements as AchievementId[],
          history: history,
          reminderHour: data.reminder_hour,
          reminderMinute: data.reminder_minute,
        });
      },
    }),
    {
      name: 'memorizakids-storage',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !['isLoading'].includes(key))
        ) as AppState,
    }
  )
);

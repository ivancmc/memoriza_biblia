import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AchievementId, achievements } from './components/AchievementsModal';
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
    (set) => ({
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
        const state = useStore.getState();
        if (!state.user) return;

        await supabase.from('profiles').upsert({
          id: state.user.id,
          current_day: state.currentDay,
          completed_days: state.completedDays,
          current_verse_ref: state.currentVerse?.reference,
          history_refs: state.history.map(v => v.reference),
          unlocked_achievements: state.unlockedAchievements,
          reminder_hour: state.reminderHour,
          reminder_minute: state.reminderMinute,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      },
      loadFromSupabase: async () => {
        const state = useStore.getState();
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
            // Reorder to match history_refs order
            history = (data.history_refs || [])
              .map((ref: string) => versesData.find((v: any) => v.reference === ref))
              .filter(Boolean)
              .map((v: any) => ({
                reference: v.reference,
                text: v.text,
                explanation: v.explanation,
                bookContext: v.book_context,
                keywords: v.keywords,
                emojiText: v.emoji_text,
                scrambled: v.scrambled,
                fakeReferences: v.fake_references,
              }));

            if (data.current_verse_ref) {
              const v = versesData.find((v: any) => v.reference === data.current_verse_ref);
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
              }
            }
          }
        }

        set({
          currentDay: data.current_day,
          completedDays: data.completed_days,
          currentVerse: currentVerse,
          unlockedAchievements: data.unlocked_achievements as AchievementId[],
          history: history,
          reminderHour: data.reminder_hour,
          reminderMinute: data.reminder_minute,
        });
      },
    }),
    {
      name: 'memorizakids-storage',
    }
  )
);

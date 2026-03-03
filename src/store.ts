import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AchievementId } from './components/AchievementsModal';
import { supabase } from './services/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Verse {
  reference: string;
  text: string;
  explanation: string;
  bookContext: string;
  keywords: string[];
  emojiText: string;
  scrambled: string[];
  fakeReferences: string[];
  isFallback?: boolean;
}

// Dados que são persistidos no localStorage (usados offline e como cache)
interface PersistedData {
  currentDay: number;
  completedDays: number[];
  currentVerse: Verse | null;
  history: Verse[];
  unlockedAchievements: AchievementId[];
  // Fila de operações pendentes para sincronizar quando voltar online
  pendingSync: boolean;
}

interface AppState extends PersistedData {
  lastUnlockedAchievement: AchievementId | null;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  setCurrentDay: (day: number) => void;
  completeDay: (day: number) => void;
  setVerse: (verse: Verse) => void;
  addToHistory: (verse: Verse) => void;
  setLoading: (loading: boolean) => void;
  resetProgress: () => void;
  clearLastUnlockedAchievement: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;

  // Sync actions
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  handleOnline: () => void;
}

// Mapeamento de verso do Supabase para a interface local
function mapSupabaseVerse(v: any): Verse {
  return {
    reference: v.reference,
    text: v.text,
    explanation: v.explanation,
    bookContext: v.book_context,
    keywords: v.keywords ?? [],
    emojiText: v.emoji_text ?? '',
    scrambled: v.scrambled ?? [],
    fakeReferences: v.fake_references ?? [],
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentDay: 1,
      completedDays: [],
      currentVerse: null,
      history: [],
      isLoading: false,
      isSyncing: false,
      unlockedAchievements: [],
      lastUnlockedAchievement: null,
      user: null,
      session: null,
      pendingSync: false,

      // --- Actions simples ---
      setCurrentDay: (day) => {
        set({ currentDay: day });
        // Sincroniza current_day quando o usuário navega entre os dias
        get().syncToSupabase();
      },

      completeDay: (day) => {
        const state = get();
        if (state.completedDays.includes(day)) return;
        set({ completedDays: [...state.completedDays, day] });
        // Sincroniza imediatamente após completar um dia
        get().syncToSupabase();
      },

      setVerse: (verse) => {
        // Atômico: novo versículo = novo ciclo (reseta dia e dias concluídos)
        set({ currentVerse: verse, currentDay: 1, completedDays: [] });
        // Sincroniza tudo de uma vez: current_verse_ref + current_day + completed_days
        get().syncToSupabase();
      },

      addToHistory: (verse) => {
        const state = get();
        const exists = state.history.some((v) => v.reference === verse.reference);
        if (exists) return;

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

        set({
          history: newHistory,
          unlockedAchievements: newAchievements,
          lastUnlockedAchievement: lastUnlocked,
        });

        // Sincroniza imediatamente após adicionar ao histórico
        get().syncToSupabase();
      },

      setLoading: (loading) => set({ isLoading: loading }),

      resetProgress: () => set({ currentDay: 1, completedDays: [] }),

      clearLastUnlockedAchievement: () => set({ lastUnlockedAchievement: null }),

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),

      // --- Sincronização Supabase → Local ---
      // Prioridade máxima: dados do Supabase SEMPRE sobrescrevem o local quando logado
      loadFromSupabase: async () => {
        const state = get();
        if (!state.user) return;

        set({ isSyncing: true });
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', state.user.id)
            .single();

          if (error || !data) {
            console.warn('[Sync] Perfil não encontrado no Supabase, mantendo dados locais.');
            return;
          }

          // Busca os versos completos do histórico
          let history: Verse[] = [];
          if (data.history_refs && data.history_refs.length > 0) {
            const { data: versesData } = await supabase
              .from('verses')
              .select('*')
              .in('reference', data.history_refs);

            if (versesData) {
              history = data.history_refs
                .map((ref: string) => versesData.find((v: any) => v.reference === ref))
                .filter(Boolean)
                .map(mapSupabaseVerse);
            }
          }

          // Busca o verso atual se houver referência salva
          let currentVerse: Verse | null = null;
          if (data.current_verse_ref) {
            const { data: verseData } = await supabase
              .from('verses')
              .select('*')
              .eq('reference', data.current_verse_ref)
              .single();

            if (verseData) {
              currentVerse = mapSupabaseVerse(verseData);
            }
          }

          // Supabase é a fonte da verdade — sobrescreve o estado local
          set({
            currentDay: data.current_day ?? 1,
            completedDays: data.completed_days ?? [],
            unlockedAchievements: (data.unlocked_achievements ?? []) as AchievementId[],
            history,
            // Só atualiza o verso atual se o Supabase tiver um salvo
            ...(currentVerse ? { currentVerse } : {}),
            pendingSync: false,
          });

          console.log('[Sync] Dados carregados do Supabase com sucesso.');
        } catch (err) {
          console.error('[Sync] Erro ao carregar do Supabase:', err);
        } finally {
          set({ isSyncing: false });
        }
      },

      // --- Sincronização Local → Supabase ---
      // Chamado imediatamente quando há mudanças, ou quando volta online
      syncToSupabase: async () => {
        const state = get();
        if (!state.user) return;

        // Se offline, marca como pendente
        if (!navigator.onLine) {
          set({ pendingSync: true });
          console.log('[Sync] Offline — alterações salvas localmente, sincronizará quando online.');
          return;
        }

        set({ isSyncing: true });
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: state.user.id,
            current_day: state.currentDay,
            completed_days: state.completedDays,
            history_refs: state.history.map((v) => v.reference),
            unlocked_achievements: state.unlockedAchievements,
            current_verse_ref: state.currentVerse?.reference ?? null,
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error('[Sync] Erro ao sincronizar com Supabase:', error);
            set({ pendingSync: true });
          } else {
            set({ pendingSync: false });
            console.log('[Sync] Dados sincronizados com Supabase.');
          }
        } catch (err) {
          console.error('[Sync] Erro de rede ao sincronizar:', err);
          set({ pendingSync: true });
        } finally {
          set({ isSyncing: false });
        }
      },

      // Chamado quando o app detecta que voltou online
      handleOnline: () => {
        const state = get();
        if (state.pendingSync && state.user) {
          console.log('[Sync] Voltou online — sincronizando dados pendentes...');
          get().syncToSupabase();
        }
      },
    }),
    {
      name: 'memorizakids-storage',
      storage: createJSONStorage(() => localStorage),
      // Persiste apenas dados de progresso, NÃO persiste user/session (segurança)
      // e NÃO persiste estados de UI transitórios
      partialize: (state) => ({
        currentDay: state.currentDay,
        completedDays: state.completedDays,
        currentVerse: state.currentVerse,
        history: state.history,
        unlockedAchievements: state.unlockedAchievements,
        pendingSync: state.pendingSync,
      }),
    }
  )
);

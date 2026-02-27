import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { RecallVerseModal } from './components/RecallVerseModal';
import { AchievementsModal, achievements } from './components/AchievementsModal';
import { useStore, Verse } from './store';
import { generateVerse } from './services/verseService';
import DayNavigator from './components/DayNavigator';
import VerseCard from './components/VerseCard';
import { BookOpen, RefreshCw, History, Sparkles, Award, LogIn, LogOut, User as UserIcon, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryModal } from './components/HistoryModal';
import ReminderManager from './components/ReminderManager';
import { usePWAInstall } from './hooks/usePWAInstall';
import InstallPromptModal from './components/InstallPromptModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { SearchModal } from './components/SearchModal';
import { supabase } from './services/supabase';


function App() {
  const {
    currentVerse, setVerse, isLoading, setLoading, resetProgress,
    history, lastUnlockedAchievement, clearLastUnlockedAchievement,
    currentDay, completedDays, reminderHour, reminderMinute,
    user, setUser, setSession, loadFromSupabase, syncToSupabase
  } = useStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [recallVerse, setRecallVerse] = useState<Verse | null>(null);
  const { isInstallAvailable, handleInstallClick } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [hasCheckedSupabase, setHasCheckedSupabase] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadFromSupabase();
      }
      setHasCheckedSupabase(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadFromSupabase();
      }
      setHasCheckedSupabase(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync state whenever it changes and user is logged in
  useEffect(() => {
    // Only sync if we have a user and we've finished the initial check/load
    if (user && hasCheckedSupabase) {
      const timeoutId = setTimeout(() => {
        syncToSupabase();
      }, 1000); // Debounce sync
      return () => clearTimeout(timeoutId);
    }
  }, [
    history.length,
    completedDays?.length,
    currentDay,
    currentVerse?.reference,
    reminderHour,
    reminderMinute,
    user,
    hasCheckedSupabase
  ]);

  useEffect(() => {
    if (isInstallAvailable) {
      setShowInstallModal(true);
    }
  }, [isInstallAvailable]);

  const handleRecall = () => {
    if (history.length > 0) {
      const randomIndex = Math.floor(Math.random() * history.length);
      setRecallVerse(history[randomIndex]);
    }
    setIsSidebarOpen(false);
  };

  const handleSearchMemorize = (verse: Verse) => {
    setVerse(verse);
    resetProgress();
  };

  const loadNewVerse = async () => {
    setLoading(true);
    try {
      const excludeRefs = history.map(v => v.reference);
      const verse = await generateVerse(excludeRefs);
      setVerse(verse);
      resetProgress();
    } catch (error) {
      console.error("Failed to load verse", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentVerse) {
      loadNewVerse();
    }
  }, []);

  useEffect(() => {
    if (lastUnlockedAchievement) {
      const achievement = achievements[lastUnlockedAchievement];
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-4"
        >
          <span className="text-3xl">{achievement.icon}</span>
          <div>
            <p className="font-bold">Conquista Desbloqueada!</p>
            <p className="text-sm">{achievement.name}</p>
          </div>
        </motion.div>
      ), { duration: 4000 });
      clearLastUnlockedAchievement();
    }
  }, [lastUnlockedAchievement, clearLastUnlockedAchievement]);

  return (
    <div className="h-screen flex flex-col font-sans text-slate-100 selection:bg-pink-500 selection:text-white overflow-hidden max-w-full">
      <Toaster position="top-center" />

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-72 bg-indigo-950 border-r border-indigo-800 z-50 flex flex-col shadow-2xl"
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-indigo-800">
          <BookOpen size={24} strokeWidth={2.5} className="text-yellow-400" />
          <span className="text-lg font-bold text-white tracking-tight">MemorizaBíblia</span>
        </div>

        {/* Sidebar Items */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          <button
            onClick={() => { setIsSearchOpen(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-300 hover:bg-indigo-800/60 hover:text-white transition-all text-left"
          >
            <Search size={20} />
            <span className="font-medium">Buscar Versículo</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleRecall}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-yellow-300 hover:bg-indigo-800/60 hover:text-white transition-all text-left"
            >
              <Sparkles size={20} />
              <span className="font-medium">Relembre</span>
            </button>
          )}

          <div className="px-4 py-3 rounded-xl hover:bg-indigo-800/60 transition-all">
            <ReminderManager />
          </div>

          <button
            onClick={() => { setIsHistoryOpen(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-300 hover:bg-indigo-800/60 hover:text-white transition-all text-left"
          >
            <History size={20} />
            <span className="font-medium">Histórico</span>
          </button>

          <button
            onClick={() => { setIsAchievementsOpen(true); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-300 hover:bg-indigo-800/60 hover:text-white transition-all text-left"
          >
            <Award size={20} />
            <span className="font-medium">Conquistas</span>
          </button>
        </nav>

      </motion.aside>

      {/* Header */}
      <header className="bg-indigo-950/80 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-indigo-800/50 transition-colors"
              aria-label="Abrir menu"
            >
              <span className="block w-5 h-0.5 bg-indigo-300 rounded-full" />
              <span className="block w-5 h-0.5 bg-indigo-300 rounded-full" />
              <span className="block w-5 h-0.5 bg-indigo-300 rounded-full" />
            </button>

            <div className="flex items-center gap-2 text-yellow-400">
              <BookOpen size={28} strokeWidth={2.5} />
              <h1 className="text-xl font-bold tracking-tight text-white">MemorizaBíblia</h1>
            </div>
          </div>

          {/* Right side: Novo Versículo + Auth Controls */}
          <div className="flex items-center gap-2">
            {/* Novo Versículo */}
            <button
              onClick={loadNewVerse}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-700/70 transition-all text-indigo-200 hover:text-white disabled:opacity-50 text-sm font-medium h-9"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Novo Versículo</span>
            </button>

            {/* Auth Controls */}
            {user ? (
              <div className="relative">
                {/* Avatar Button */}
                <button
                  onClick={() => setIsUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-700/70 transition-all text-white h-9"
                  title="Minha conta"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-yellow-400 flex-shrink-0">
                    <UserIcon size={14} />
                  </div>
                  <span className="text-sm font-semibold hidden sm:block max-w-[90px] truncate">
                    {user.user_metadata?.display_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    {/* Invisible overlay to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-indigo-900 border border-indigo-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-indigo-800">
                        <p className="text-xs text-indigo-400 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { setIsProfileOpen(true); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white transition-all text-left"
                      >
                        <UserIcon size={16} />
                        Meu Perfil
                      </button>
                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await supabase.auth.signOut();
                          toast.success('Até logo!');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pink-400 hover:bg-pink-500/10 transition-all text-left"
                      >
                        <LogOut size={16} />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-950 font-bold hover:from-yellow-300 hover:to-orange-400 transition-all text-sm shadow shadow-yellow-500/20 h-9"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-yellow-400 rounded-full animate-spin" />
            <p className="text-indigo-300 font-medium animate-pulse">Viajando pelo universo bíblico...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="flex-none pt-2 pb-4 z-10">
              <DayNavigator />
            </div>

            <div className="flex-1 flex items-start justify-center w-full">
              <VerseCard onNewVerse={loadNewVerse} />
            </div>
          </div>
        )}
      </main>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <RecallVerseModal verse={recallVerse} onClose={() => setRecallVerse(null)} />
      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {user && <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onStartMemorization={handleSearchMemorize}
      />
      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onInstall={handleInstallClick}
      />

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
    </div>
  );
}

export default App;

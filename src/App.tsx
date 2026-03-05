import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { RecallVerseModal } from './components/RecallVerseModal';
import { AchievementsModal, achievements } from './components/AchievementsModal';
import { useStore, Verse } from './store';
import { generateVerse } from './services/verseService';
import DayNavigator from './components/DayNavigator';
import VerseCard from './components/VerseCard';
import { BookOpen, RefreshCw, History, Sparkles, Award, LogIn, LogOut, User as UserIcon, Search, Cloud, CloudOff, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryPage } from './components/HistoryPage';
import ReminderManager from './components/ReminderManager';
import { usePWAInstall } from './hooks/usePWAInstall';
import InstallPromptModal from './components/InstallPromptModal';
import { AuthPage } from './components/AuthPage';
import { ProfileModal } from './components/ProfileModal';
import { SearchPage } from './components/SearchPage';
import { FeedbackModal } from './components/FeedbackModal';
import { supabase } from './services/supabase';


function App() {
  const {
    currentVerse, setVerse, isLoading, setLoading,
    history, lastUnlockedAchievement, clearLastUnlockedAchievement,
    user, setUser, setSession, loadFromSupabase,
    handleOnline, isSyncing, pendingSync,
  } = useStore();
  const [activeView, setActiveView] = useState<'home' | 'search' | 'history'>('home');
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [recallVerse, setRecallVerse] = useState<Verse | null>(null);
  const { isInstallAvailable, handleInstallClick } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFromSupabase();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Detecta quando o app volta a ficar online (importante para PWA offline)
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [handleOnline]);

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
    setVerse(verse); // já reseta o ciclo internamente
    setActiveView('home');
  };

  const loadNewVerse = async () => {
    setLoading(true);
    try {
      const excludeRefs = history.map(v => v.reference);
      const verse = await generateVerse(excludeRefs);
      setVerse(verse); // já reseta o ciclo internamente
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
    <>
      <Toaster position="top-center" />

      {!user && !isGuest ? (
        <AuthPage onGuestEntry={() => setIsGuest(true)} />
      ) : (
        <div className="h-screen flex flex-col font-sans text-slate-100 selection:bg-pink-500 selection:text-white overflow-hidden max-w-full">

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
              <div className="px-4 py-3 rounded-xl hover:bg-indigo-800/60 transition-all">
                <ReminderManager />
              </div>

              <button
                onClick={() => { setActiveView('search'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeView === 'search' ? 'bg-indigo-800 text-white shadow-lg shadow-indigo-900/40 ring-1 ring-indigo-500/20' : 'text-indigo-300 hover:bg-indigo-800/60 hover:text-white'}`}
              >
                <Search size={20} />
                <span className="font-medium">Buscar Versículo</span>
              </button>

              <button
                onClick={() => { setActiveView('history'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeView === 'history' ? 'bg-indigo-800 text-white shadow-lg shadow-indigo-900/40 ring-1 ring-indigo-500/20' : 'text-indigo-300 hover:bg-indigo-800/60 hover:text-white'}`}
              >
                <History size={20} />
                <span className="font-medium">Histórico</span>
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

              <button
                onClick={() => { setIsAchievementsOpen(true); setIsSidebarOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-300 hover:bg-indigo-800/60 hover:text-white transition-all text-left"
              >
                <Award size={20} />
                <span className="font-medium">Conquistas</span>
              </button>

              <button
                onClick={() => { setIsFeedbackOpen(true); setIsSidebarOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-300 hover:bg-indigo-800/60 hover:text-white transition-all text-left"
              >
                <MessageSquare size={20} />
                <span className="font-medium">Enviar Feedback</span>
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
                  className="flex flex-col gap-1 md:gap-1.5 p-1.5 md:p-2 rounded-lg hover:bg-indigo-800/50 transition-colors"
                  aria-label="Abrir menu"
                >
                  <span className="block w-4 md:w-5 h-0.5 bg-indigo-300 rounded-full" />
                  <span className="block w-4 md:w-5 h-0.5 bg-indigo-300 rounded-full" />
                  <span className="block w-4 md:w-5 h-0.5 bg-indigo-300 rounded-full" />
                </button>

                <button
                  onClick={() => setActiveView('home')}
                  className="flex items-center gap-1.5 md:gap-2 text-yellow-400 group focus:outline-none"
                >
                  <BookOpen size={22} strokeWidth={2.5} className="md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
                  <h1 className="text-lg md:text-xl font-bold tracking-tight text-white group-hover:text-yellow-400 transition-colors">MemorizaBíblia</h1>
                </button>
              </div>

              {/* Right side: Indicador de sync + Novo Versículo + Auth Controls */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {/* Indicador de sincronização (apenas para usuários logados) */}
                {user && (
                  <div
                    title={isSyncing ? 'Sincronizando...' : pendingSync ? 'Dados pendentes — offline' : 'Sincronizado'}
                    className={`flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg transition-all ${isSyncing
                      ? 'text-yellow-400 animate-pulse'
                      : pendingSync
                        ? 'text-orange-400'
                        : 'text-indigo-500'
                      }`}
                  >
                    {pendingSync ? <CloudOff size={13} className="md:w-[15px] md:h-[15px]" /> : <Cloud size={13} className={`md:w-[15px] md:h-[15px] ${isSyncing ? 'animate-pulse' : ''}`} />}
                  </div>
                )}
                {/* Novo Versículo */}
                <button
                  onClick={loadNewVerse}
                  disabled={isLoading}
                  className="flex items-center justify-center p-2 md:px-3 md:py-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-700/70 transition-all text-indigo-200 hover:text-white disabled:opacity-50 h-8 w-8 md:h-9 md:w-auto font-medium"
                >
                  <RefreshCw size={14} className={`md:w-4 md:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline ml-2 text-sm">Novo Versículo</span>
                </button>

                {/* Auth Controls */}
                {user ? (
                  <div className="relative">
                    {/* Avatar Button */}
                    <button
                      onClick={() => setIsUserMenuOpen(v => !v)}
                      className="flex items-center gap-1.5 md:gap-2 p-1 md:px-3 md:py-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-700/70 transition-all text-white h-8 md:h-9"
                      title="Minha conta"
                    >
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-indigo-600 flex items-center justify-center text-yellow-400 flex-shrink-0">
                        <UserIcon size={12} className="md:w-3.5 md:h-3.5" />
                      </div>
                      <span className="text-xs md:text-sm font-semibold hidden md:block max-w-[90px] truncate">
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
                    onClick={() => setIsGuest(false)}
                    className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-950 font-bold hover:from-yellow-300 hover:to-orange-400 transition-all text-xs md:text-sm shadow shadow-yellow-500/20 h-8 md:h-9"
                  >
                    <LogIn size={14} className="md:w-4 md:h-4" />
                    <span>Entrar</span>
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
              <div className="flex flex-col min-h-full w-full">
                {activeView === 'home' && (
                  <div className="flex flex-col min-h-full w-full">
                    <div className="flex-none pt-2 pb-4 z-10">
                      <DayNavigator />
                    </div>

                    <div className="flex items-start justify-center w-full pb-8">
                      <VerseCard onNewVerse={loadNewVerse} />
                    </div>
                  </div>
                )}
                {activeView === 'search' && (
                  <SearchPage
                    onBack={() => setActiveView('home')}
                    onStartMemorization={handleSearchMemorize}
                  />
                )}
                {activeView === 'history' && (
                  <HistoryPage
                    onBack={() => setActiveView('home')}
                  />
                )}
              </div>
            )}
          </main>

          <RecallVerseModal verse={recallVerse} onClose={() => setRecallVerse(null)} />
          <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />

          {user && <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />}
          <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} user={user} />
          <InstallPromptModal
            isOpen={showInstallModal}
            onClose={() => setShowInstallModal(false)}
            onInstall={handleInstallClick}
          />

          {/* Footer Decoration */}
          <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
        </div>
      )}
    </>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { RecallVerseModal } from './components/RecallVerseModal';
import { AchievementsModal, achievements } from './components/AchievementsModal';
import { useStore, Verse } from './store';
import { generateVerse } from './services/verseService';
import DayNavigator from './components/DayNavigator';
import VerseCard from './components/VerseCard';
import { BookOpen, RefreshCw, History, Sparkles, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryModal } from './components/HistoryModal';
import ReminderManager from './components/ReminderManager';
import { usePWAInstall } from './hooks/usePWAInstall';
import InstallPromptModal from './components/InstallPromptModal';

function App() {
  const { currentVerse, setVerse, isLoading, setLoading, resetProgress, history, lastUnlockedAchievement, clearLastUnlockedAchievement } = useStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [recallVerse, setRecallVerse] = useState<Verse | null>(null);
  const { isInstallAvailable, handleInstallClick } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);

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
    <div className="h-screen flex flex-col font-sans text-slate-100 selection:bg-pink-500 selection:text-white overflow-hidden">
      <Toaster position="top-center" />
      {/* Header */}
      <header className="bg-indigo-950/80 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400">
            <BookOpen size={28} strokeWidth={2.5} />
            <h1 className="text-xl font-bold tracking-tight text-white">MemorizaBíblia</h1>
          </div>

          <div className="flex items-center gap-4">
            {history.length > 0 && (
              <button
                onClick={handleRecall}
                className="text-sm font-medium text-yellow-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Sparkles size={20} />
                <span className="hidden sm:inline">Relembre</span>
              </button>
            )}
            <ReminderManager />
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-sm font-medium text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <History size={20} />
              <span className="hidden sm:inline">Histórico</span>
            </button>

            <button
              onClick={() => setIsAchievementsOpen(true)}
              className="text-sm font-medium text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Award size={20} />
              <span className="hidden sm:inline">Conquistas</span>
            </button>

            <button
              onClick={loadNewVerse}
              disabled={isLoading}
              className="text-sm font-medium text-indigo-300 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Novo Versículo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 overflow-y-auto">
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

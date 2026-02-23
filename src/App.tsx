import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { SurpriseVerseModal } from './components/SurpriseVerseModal';
import { AchievementsModal, achievements } from './components/AchievementsModal';
import { useStore, Verse } from './store';
import { generateVerse } from './services/verseService';
import DayNavigator from './components/DayNavigator';
import VerseCard from './components/VerseCard';
import { BookOpen, RefreshCw, History, Gift, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryModal } from './components/HistoryModal';
import ReminderManager from './components/ReminderManager';

function App() {
  const { currentVerse, setVerse, isLoading, setLoading, resetProgress, history, lastUnlockedAchievement, clearLastUnlockedAchievement } = useStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [surpriseVerse, setSurpriseVerse] = useState<Verse | null>(null);

  const handleSurpriseMe = () => {
    if (history.length > 0) {
      const randomIndex = Math.floor(Math.random() * history.length);
      setSurpriseVerse(history[randomIndex]);
    }
  };

  const loadNewVerse = async () => {
    setLoading(true);
    try {
      const verse = await generateVerse();
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
    <div className="min-h-screen font-sans text-slate-100 selection:bg-pink-500 selection:text-white pb-20">
      <Toaster position="top-center" />
        {/* Header */}
      <header className="bg-indigo-950/80 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400">
            <BookOpen size={28} strokeWidth={2.5} />
            <h1 className="text-xl font-bold tracking-tight text-white">MemorizaKids</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {history.length > 0 && (
              <button 
                onClick={handleSurpriseMe}
                className="text-sm font-medium text-yellow-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Gift size={20} />
                <span className="hidden sm:inline">Surpreenda-me!</span>
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

      <main className="max-w-4xl mx-auto px-4 py-4 md:py-8 flex flex-col h-[calc(100vh-64px)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-yellow-400 rounded-full animate-spin" />
            <p className="text-indigo-300 font-medium animate-pulse">Viajando pelo universo bíblico...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-none pt-2 pb-4 z-10">
              {currentVerse?.isFallback && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded-lg mb-4 text-sm text-center">
                  ⚠️ Não foi possível gerar um novo versículo. Mostrando um exemplo offline.
                </div>
              )}
              <DayNavigator />
            </div>
            
            <div className="flex-1 flex items-start justify-center">
              <VerseCard onNewVerse={loadNewVerse} />
            </div>
          </div>
        )}
      </main>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SurpriseVerseModal verse={surpriseVerse} onClose={() => setSurpriseVerse(null)} />
      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
    </div>
  );
}

export default App;

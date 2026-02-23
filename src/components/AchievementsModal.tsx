import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Lock } from 'lucide-react';
import { useStore } from '../store';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const achievements = {
  '1_verse': { name: 'Iniciante na Palavra', description: 'Memorize seu primeiro versículo.', icon: '🥉' },
  '5_verses': { name: 'Explorador Bíblico', description: 'Memorize 5 versículos.', icon: '🥈' },
  '10_verses': { name: 'Sábio Estudante', description: 'Memorize 10 versículos.', icon: '🥇' },
  '25_verses': { name: 'Mestre das Escrituras', description: 'Memorize 25 versículos.', icon: '🏆' },
};

export type AchievementId = keyof typeof achievements;

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { history, unlockedAchievements } = useStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-indigo-500/30 bg-indigo-950/50">
              <div className="flex items-center gap-3 text-yellow-400">
                <Award size={24} />
                <h2 className="text-xl font-bold text-white">Minhas Conquistas</h2>
              </div>
              <button
                onClick={onClose}
                className="text-indigo-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Object.entries(achievements).map(([id, achievement]) => {
                const isUnlocked = unlockedAchievements.includes(id as AchievementId);
                return (
                  <div key={id} className={`flex items-center gap-4 p-4 rounded-lg border ${isUnlocked ? 'bg-green-950/50 border-green-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className={`text-4xl ${isUnlocked ? '' : 'opacity-30'}`}>{achievement.icon}</div>
                    <div>
                      <h3 className={`font-bold ${isUnlocked ? 'text-green-300' : 'text-slate-400'}`}>{achievement.name}</h3>
                      <p className={`text-sm ${isUnlocked ? 'text-green-400/80' : 'text-slate-500'}`}>{achievement.description}</p>
                    </div>
                    {!isUnlocked && <Lock size={20} className="ml-auto text-slate-500" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

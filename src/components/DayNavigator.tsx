import React from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Star } from 'lucide-react';
import { useStore } from '../store';

const DayNavigator: React.FC = () => {
  const { currentDay, completedDays, setCurrentDay } = useStore();

  return (
    <div className="flex justify-start md:justify-center gap-2 mb-2 overflow-x-auto p-4 w-full no-scrollbar">
      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
        const isCompleted = completedDays.includes(day);
        const isCurrent = currentDay === day;
        const isLocked = day > Math.max(0, ...completedDays) + 1 && day !== 1;

        return (
          <motion.button
            key={day}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => !isLocked && setCurrentDay(day)}
            className={`
              relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors
              ${isCurrent ? 'bg-yellow-400 text-yellow-900 ring-4 ring-yellow-200/50' : ''}
              ${isCompleted && !isCurrent ? 'bg-green-500 text-white' : ''}
              ${!isCompleted && !isCurrent && !isLocked ? 'bg-indigo-700 text-indigo-100 hover:bg-indigo-600' : ''}
              ${isLocked ? 'bg-indigo-900/50 text-indigo-500/50 cursor-not-allowed border-2 border-indigo-900' : ''}
            `}
            disabled={isLocked}
          >
            {isCompleted ? (
              <Check size={20} strokeWidth={3} />
            ) : isLocked ? (
              <Lock size={16} />
            ) : (
              day
            )}

            {day === 7 && (
              <div className="absolute -top-2 -right-2 text-yellow-500">
                <Star size={16} fill="currentColor" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default DayNavigator;

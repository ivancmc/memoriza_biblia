import React from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Verse } from '@/src/store';

interface Day1ActivityProps {
  verse: Verse;
  onComplete: () => void;
  onSpeak: () => void;
}

const Day1Activity: React.FC<Day1ActivityProps> = ({ verse, onComplete, onSpeak }) => {
  return (
    <div className="text-center space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-2">Dia 1: Vamos Conhecer!</h2>
      <p className="text-xl md:text-3xl font-medium text-white leading-relaxed font-serif">
        "{verse.text}"
      </p>
      <p className="text-base md:text-lg text-indigo-300 font-semibold mt-2">{verse.reference}</p>
      
      <div className="flex flex-col gap-3 items-center mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSpeak}
          className="bg-indigo-800 text-indigo-200 px-6 py-3 rounded-full flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors w-full max-w-xs justify-center"
        >
          <Volume2 size={24} />
          Ouvir Versículo
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition-colors w-full max-w-xs"
        >
          Já Li e Ouvi!
        </motion.button>
      </div>
    </div>
  );
};

export default Day1Activity;

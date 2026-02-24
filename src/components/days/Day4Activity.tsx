import React from 'react';
import { motion } from 'motion/react';
import { Verse } from '@/src/store';

interface Day4ActivityProps {
  verse: Verse;
  onComplete: () => void;
}

const Day4Activity: React.FC<Day4ActivityProps> = ({ verse, onComplete }) => {
  return (
    <div className="text-center space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-purple-400 mb-2">Dia 4: Versículo com emojis</h2>
      <p className="text-2xl md:text-3xl leading-relaxed bg-indigo-950/50 p-4 md:p-6 rounded-3xl shadow-inner border border-purple-500/30">
        {verse.emojiText}
      </p>
      <p className="text-base md:text-lg font-bold text-purple-300 mt-2">{verse.reference}</p>

      <div className="mt-6">
        <p className="text-indigo-300 mb-4 text-sm md:text-base">Você consegue adivinhar as palavras?</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="bg-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-purple-600"
        >
          Acertei tudo!
        </motion.button>
      </div>
    </div>
  );
};

export default Day4Activity;

import React from 'react';
import { motion } from 'motion/react';
import { Verse } from '@/src/store';

interface Day2ActivityProps {
  verse: Verse;
  onComplete: () => void;
}

const Day2Activity: React.FC<Day2ActivityProps> = ({ verse, onComplete }) => {
  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-bold text-pink-400 mb-4">Dia 2: O que significa?</h2>
      <p className="text-lg text-indigo-400 italic">
        "{verse.text}" <span className="font-bold not-italic text-pink-400 ml-2">{verse.reference}</span>
      </p>
      <div className="bg-indigo-950/50 p-6 rounded-2xl border-2 border-pink-500/30">
        <p className="text-xl text-indigo-100 leading-relaxed mb-4">
          {verse.explanation}
        </p>
        {verse.bookContext && (
          <div className="mt-4 pt-4 border-t border-pink-500/30">
            <p className="text-sm font-bold text-pink-400 uppercase tracking-wide mb-1">Sobre o livro</p>
            <p className="text-md text-indigo-300 italic">
              {verse.bookContext}
            </p>
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        className="mt-8 bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 transition-colors"
      >
        Entendi
      </motion.button>
    </div>
  );
};

export default Day2Activity;

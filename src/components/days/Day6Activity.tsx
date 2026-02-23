import React from 'react';
import { motion } from 'motion/react';
import { Verse } from '@/src/store';

interface Day6ActivityProps {
  verse: Verse;
  onComplete: () => void;
}

const Day6Activity: React.FC<Day6ActivityProps> = ({ verse, onComplete }) => {
  return (
    <div className="text-center space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-teal-400 mb-2">Dia 6: Primeira Letra</h2>
      <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed tracking-widest font-mono">
        {verse.text.split(' ').map(w => w[0] + (w.length > 1 ? '_' : '') + (w.match(/[.,;!?]$/)?.[0] || '')).join(' ')}
      </p>
      <p className="text-base md:text-lg text-teal-400 font-bold font-mono mt-4 tracking-widest">
         {verse.reference.split(' ').map(w => w[0] + (w.length > 1 ? '_' : '')).join(' ')}
      </p>
      
      <div className="mt-6">
        <p className="text-indigo-300 mb-4 text-sm md:text-base">Tente recitar o versículo completo (e a referência)!</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="bg-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-teal-600"
        >
          Consegui Recitar!
        </motion.button>
      </div>
    </div>
  );
};

export default Day6Activity;

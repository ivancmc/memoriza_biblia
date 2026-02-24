import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle, CheckCircle, Star } from 'lucide-react';
import { Verse } from '@/src/store';

interface Day7ActivityProps {
  verse: Verse;
  onComplete: () => void;
}

const Day7Activity: React.FC<Day7ActivityProps> = ({ verse, onComplete }) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Dia 7: Grande desafio!</h2>

      <div className="bg-yellow-500/20 p-8 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-4 border border-yellow-500/50">
        <Star size={48} className="text-yellow-400 animate-pulse" fill="currentColor" />
      </div>

      <p className="text-xl text-indigo-100">
        Você consegue recitar o versículo inteiro e a referência sem olhar?
      </p>

      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-950/50 p-4 rounded-xl shadow-sm border border-indigo-500/30 mt-4"
        >
          <p className="text-indigo-200 italic">"{verse.text}"</p>
          <p className="text-yellow-400 font-semibold mt-2">{verse.reference}</p>
        </motion.div>
      )}

      <div className="flex justify-center gap-4 mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHint(!showHint)}
          className="bg-indigo-800 text-indigo-300 px-4 py-2 rounded-full flex items-center gap-2 font-bold hover:bg-indigo-700"
        >
          <HelpCircle size={20} />
          {showHint ? 'Esconder' : 'Espiar'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="bg-yellow-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-yellow-600 flex items-center gap-2"
        >
          <CheckCircle size={24} />
          Eu memorizei!
        </motion.button>
      </div>
    </div>
  );
};

export default Day7Activity;

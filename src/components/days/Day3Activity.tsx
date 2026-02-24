import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Verse } from '@/src/store';

interface Day3ActivityProps {
  verse: Verse;
  referenceOptions: string[];
  onComplete: () => void;
}

const Day3Activity: React.FC<Day3ActivityProps> = ({ verse, referenceOptions, onComplete }) => {
  const [referenceSolved, setReferenceSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const words = verse.text.split(' ');

  if (!referenceSolved) {
    return (
      <div className="text-center space-y-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-4">Dia 3: Qual é a referência?</h2>
        <p className="text-xl text-indigo-200 mb-8">Antes de completar o versículo, você lembra onde ele está na Bíblia?</p>

        <div className="grid gap-4 max-w-md mx-auto">
          {referenceOptions.map((ref, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (ref === verse.reference) {
                  setReferenceSolved(true);
                  confetti({
                    particleCount: 50,
                    spread: 50,
                    origin: { y: 0.6 },
                    colors: ['#60A5FA']
                  });
                } else {
                  setError('Ops! Essa não é a referência correta. Tente outra!');
                  setTimeout(() => setError(null), 2000);
                }
              }}
              className="bg-indigo-800 border-2 border-blue-500/30 text-white p-4 rounded-xl font-bold text-lg shadow-sm hover:border-blue-400 hover:bg-indigo-700 transition-all"
            >
              {ref}
            </motion.button>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/50 text-red-200 border border-red-500/50 px-4 py-2 rounded-lg font-medium inline-block mt-4"
          >
            {error}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-bold text-blue-400 mb-4">Dia 3: Complete o versículo recitando</h2>
      <p className="text-lg text-blue-200 font-semibold mb-6 bg-blue-900/50 inline-block px-4 py-1 rounded-full border border-blue-500/30">
        {verse.reference}
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-2xl font-medium leading-loose">
        {words.map((word, idx) => {
          const cleanWord = word.replace(/[.,;!?]/g, '');
          const isKeyword = verse.keywords.some(k => k.toLowerCase() === cleanWord.toLowerCase());

          if (isKeyword) {
            return (
              <span key={idx} className="border-b-2 border-blue-400 min-w-[80px] text-blue-300 px-2 bg-blue-900/30 rounded">
                {showHint ? word : '____'}
              </span>
            );
          }
          return <span key={idx} className="text-white">{word}</span>;
        })}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHint(!showHint)}
          className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-4 py-2 rounded-full flex items-center gap-2 font-bold hover:bg-yellow-500/30"
        >
          <HelpCircle size={20} />
          {showHint ? 'Esconder dica' : 'Ver dica'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-600"
        >
          Consegui!
        </motion.button>
      </div>
    </div>
  );
};

export default Day3Activity;

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { Verse } from '@/src/store';

interface Day5ActivityProps {
  verse: Verse;
  onComplete: () => void;
}

const Day5Activity: React.FC<Day5ActivityProps> = ({ verse, onComplete }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);

  const getScrambledWords = (verse: Verse) => {
    if (!verse) return [];
    const parts = verse.reference.split(':');
    let refParts = [verse.reference];
    if (parts.length === 2) {
      const verseNum = parts[1];
      const bookChapter = parts[0];
      const lastSpace = bookChapter.lastIndexOf(' ');
      if (lastSpace !== -1) {
        const book = bookChapter.substring(0, lastSpace);
        const chapter = bookChapter.substring(lastSpace + 1);
        refParts = [book, chapter, ':', verseNum];
      }
    }
    return [...verse.text.split(' '), ...refParts].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    setScrambledWords(getScrambledWords(verse));
    setSelectedWords([]);
    setError(null);
  }, [verse]);

  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-bold text-orange-400 mb-4">Dia 5: Coloque em ordem</h2>

      <div className="min-h-[60px] bg-orange-900/20 p-4 rounded-xl border-2 border-dashed border-orange-500/30 flex flex-wrap gap-2 justify-center mb-6">
        {selectedWords.map((word, idx) => (
          <motion.button
            layoutId={`word-${word}-${idx}`}
            key={`${word}-${idx}`}
            onClick={() => {
              setSelectedWords(prev => prev.filter((_, i) => i !== idx));
              setScrambledWords(prev => [...prev, word]);
              setError(null);
            }}
            className="bg-indigo-800 text-orange-200 px-3 py-1 rounded-lg shadow-sm font-bold border border-orange-500/30"
          >
            {word}
          </motion.button>
        ))}
        {selectedWords.length === 0 && <span className="text-indigo-400 italic">Toque nas palavras para montar o versículo com referência no final...</span>}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {scrambledWords.map((word, idx) => (
          <motion.button
            layoutId={`word-${word}-${idx}`}
            key={`${word}-${idx}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setScrambledWords(prev => prev.filter((_, i) => i !== idx));
              setSelectedWords(prev => [...prev, word]);
              setError(null);
            }}
            className="bg-orange-500/20 text-orange-200 border border-orange-500/30 px-4 py-2 rounded-xl font-bold hover:bg-orange-500/30 transition-colors"
          >
            {word}
          </motion.button>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setScrambledWords(getScrambledWords(verse));
            setSelectedWords([]);
            setError(null);
          }}
          className="bg-indigo-800 text-indigo-300 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-indigo-700"
        >
          <RefreshCw size={18} />
          Reiniciar
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const currentText = selectedWords.join(' ');
            const normalizedCurrent = currentText.replace(/\s+:\s+/g, ':');
            const cleanCurrent = normalizedCurrent.replace(/[.,;!?]/g, '').toLowerCase();
            const cleanOriginal = (verse.text + ' ' + verse.reference).replace(/[.,;!?]/g, '').toLowerCase();

            if (cleanCurrent === cleanOriginal) {
              onComplete();
            } else {
              setError('Ops! A ordem não está correta. Verifique o texto e a referência (Livro Capítulo : Versículo)!');
            }
          }}
          className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-orange-600"
        >
          Verificar
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/50 text-red-200 border border-red-500/50 px-4 py-2 rounded-lg font-medium inline-block"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default Day5Activity;

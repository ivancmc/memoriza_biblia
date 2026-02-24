import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, RefreshCw, CheckCircle, HelpCircle, Star } from 'lucide-react';
import Day1Activity from './days/Day1Activity';
import Day2Activity from './days/Day2Activity';
import Day3Activity from './days/Day3Activity';
import Day4Activity from './days/Day4Activity';
import Day5Activity from './days/Day5Activity';
import Day6Activity from './days/Day6Activity';
import Day7Activity from './days/Day7Activity';
import confetti from 'canvas-confetti';
import { useStore } from '../store';

interface VerseCardProps {
  onNewVerse: () => void;
}

const VerseCard: React.FC<VerseCardProps> = ({ onNewVerse }) => {
  const { currentDay, currentVerse, completeDay, addToHistory } = useStore();
  const [userInput, setUserInput] = useState('');
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceSolved, setReferenceSolved] = useState(false);
  const [referenceOptions, setReferenceOptions] = useState<string[]>([]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setUserInput('');
    setSelectedWords([]);
    setShowHint(false);
    setIsCorrect(false);
    setError(null);
    setReferenceSolved(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    if (currentVerse) {
      if (currentDay === 3) {
        // Setup Reference Quiz for Day 3
        const options = [currentVerse.reference, ...(currentVerse.fakeReferences || [])];
        setReferenceOptions(options.sort(() => Math.random() - 0.5));
      } else if (currentDay === 5) {
        // Day5Activity now handles its own word scrambling logic
        setScrambledWords([]); // Reset for the new component instance
      }
    }
  }, [currentDay, currentVerse]);

  if (!currentVerse) return null;

  const handleComplete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FCD34D', '#F87171', '#60A5FA', '#34D399']
    });
    setIsCorrect(true);
    setTimeout(() => completeDay(currentDay), 1500);
  };

  const speakText = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentVerse.text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const renderContent = () => {
    switch (currentDay) {
      case 1: // Leitura e Escuta
        return (
          <Day1Activity
            verse={currentVerse}
            onComplete={handleComplete}
            onSpeak={speakText}
            isSpeaking={isSpeaking}
          />
        );

      case 2: // Explicação
        return <Day2Activity verse={currentVerse} onComplete={handleComplete} />;

      case 3: // Preencher Lacunas
        return <Day3Activity verse={currentVerse} referenceOptions={referenceOptions} onComplete={handleComplete} />;

      case 4: // Emojis
        return <Day4Activity verse={currentVerse} onComplete={handleComplete} />;

      case 5: // Ordenação (Scramble)
        return <Day5Activity verse={currentVerse} onComplete={handleComplete} />;

      case 6: // Primeira Letra
        return <Day6Activity verse={currentVerse} onComplete={handleComplete} />;

      case 7: // Desafio Final
        return <Day7Activity verse={currentVerse} onComplete={handleComplete} />;

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-slate-900/90 backdrop-blur-sm border border-indigo-500/30 rounded-3xl shadow-2xl p-4 md:p-8 max-w-2xl mx-auto w-full relative overflow-hidden text-slate-100"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 z-20" />

      <div className="relative z-10 flex flex-col justify-center h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {isCorrect && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-indigo-950/95 backdrop-blur-md z-20 p-6"
        >
          <div className="text-center w-full">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Star size={currentDay === 7 ? 100 : 80} className="text-yellow-400 mx-auto drop-shadow-lg" fill="currentColor" />
            </motion.div>

            {currentDay === 7 ? (
              <>
                <h3 className="text-3xl md:text-4xl font-bold text-white mt-6 mb-2">Incrível!</h3>
                <p className="text-indigo-200 text-lg mb-8">Você memorizou o versículo da semana!</p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsCorrect(false);
                    addToHistory(currentVerse);
                    onNewVerse();
                  }}
                  className="bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-xl hover:bg-green-600 transition-colors w-full max-w-sm mx-auto flex items-center justify-center gap-2 text-lg"
                >
                  <RefreshCw size={24} />
                  Começar novo versículo
                </motion.button>
              </>
            ) : (
              <>
                <h3 className="text-3xl font-bold text-white mt-4">Parabéns!</h3>
                <p className="text-indigo-300 font-medium">Dia {currentDay} completado!</p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VerseCard;

import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { Book, X } from 'lucide-react';

interface HistoryViewProps {
  onClose: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onClose }) => {
  const { history } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden text-slate-100">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 z-20" />
        
        <div className="p-6 border-b border-indigo-500/30 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-full">
              <Book className="text-yellow-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Meus Versículos</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-12 text-indigo-300">
              <p className="text-xl mb-2">Você ainda não completou nenhum versículo.</p>
              <p className="text-sm opacity-70">Complete os 7 dias de desafio para guardar versículos aqui!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((verse, idx) => (
                <motion.div
                  key={`${verse.reference}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 hover:bg-indigo-900/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-yellow-400">{verse.reference}</h3>
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                      Memorizado
                    </span>
                  </div>
                  <p className="text-slate-200 italic mb-3">"{verse.text}"</p>
                  <p className="text-sm text-indigo-300">{verse.explanation}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryView;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Calendar, ChevronDown, Save } from 'lucide-react';
import { useStore, Verse } from '../store';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const { history, updateNotes } = useStore();
  const [expandedVerse, setExpandedVerse] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (expandedVerse) {
      const verse = history.find(v => v.reference === expandedVerse);
      setNote(verse?.notes || '');
    } else {
      setNote('');
    }
  }, [expandedVerse, history]);

  const handleSaveNote = () => {
    if (expandedVerse) {
      updateNotes(expandedVerse, note);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-indigo-500/30 bg-indigo-950/50">
              <div className="flex items-center gap-3 text-yellow-400">
                <BookOpen size={24} />
                <h2 className="text-xl font-bold text-white">Meus Versículos</h2>
              </div>
              <button
                onClick={onClose}
                className="text-indigo-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-12 text-indigo-300">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Você ainda não completou nenhum versículo.</p>
                  <p className="text-sm mt-2 opacity-70">Complete os 7 dias de desafios para salvar seus versículos aqui!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((verse, index) => {
                    const isExpanded = expandedVerse === verse.reference;
                    return (
                      <motion.div
                        key={`${verse.reference}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, layout: { duration: 0.3 } }}
                        className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-5 overflow-hidden"
                      >
                        <div 
                          className="flex justify-between items-center cursor-pointer" 
                          onClick={() => setExpandedVerse(isExpanded ? null : verse.reference)}
                        >
                          <h3 className="text-lg font-bold text-yellow-400">{verse.reference}</h3>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                            <ChevronDown className="text-indigo-400" />
                          </motion.div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <p className="text-slate-200 font-serif leading-relaxed">"{verse.text}"</p>
                              {verse.bookContext && (
                                <p className="text-xs text-indigo-400 mt-3 italic border-t border-indigo-500/20 pt-2">
                                  {verse.bookContext}
                                </p>
                              )}
                              <div className="mt-4 pt-4 border-t border-indigo-500/20">
                                <h4 className="text-sm font-bold text-yellow-400 mb-2">Minhas Anotações</h4>
                                <textarea 
                                  className="w-full bg-indigo-950/20 border border-indigo-500/30 rounded-lg p-2 text-slate-200 text-sm focus:ring-yellow-400 focus:border-yellow-400 transition"
                                  rows={3}
                                  value={note}
                                  onChange={(e) => setNote(e.target.value)}
                                  placeholder="Escreva seus pensamentos sobre este versículo..."
                                />
                                <button 
                                  onClick={handleSaveNote}
                                  className="mt-2 w-full flex items-center justify-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors text-sm"
                                >
                                  <Save size={16} />
                                  Salvar Anotação
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer Decoration */}
            <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

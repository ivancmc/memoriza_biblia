import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { Verse } from '../store';

interface RecallVerseModalProps {
    verse: Verse | null;
    onClose: () => void;
}

export const RecallVerseModal: React.FC<RecallVerseModalProps> = ({ verse, onClose }) => {
    return (
        <AnimatePresence>
            {verse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border-2 border-yellow-400/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-yellow-400/30 bg-yellow-950/30">
                            <div className="flex items-center gap-3 text-yellow-400">
                                <Sparkles size={24} />
                                <h2 className="text-xl font-bold text-white">Relembre o Versículo</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-yellow-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 text-center">
                            <p className="text-3xl font-serif text-slate-100 leading-relaxed mb-4">"{verse.text}"</p>
                            <p className="text-lg font-bold text-yellow-400">- {verse.reference} -</p>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-950/50 text-center">
                            <button
                                onClick={onClose}
                                className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition-colors"
                            >
                                Lembrei!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

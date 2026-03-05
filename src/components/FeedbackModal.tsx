import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Loader2, Send, Bug, Lightbulb, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: SupabaseUser | null;
}

type Category = 'erro' | 'sugestao' | 'elogio';

const categories: { id: Category; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
    {
        id: 'erro',
        label: 'Erro',
        icon: <Bug size={18} />,
        color: 'text-red-400 border-red-500/30 bg-red-500/10',
        activeColor: 'text-red-300 border-red-400 bg-red-500/30 shadow-red-500/20',
    },
    {
        id: 'sugestao',
        label: 'Sugestão',
        icon: <Lightbulb size={18} />,
        color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
        activeColor: 'text-yellow-300 border-yellow-400 bg-yellow-500/30 shadow-yellow-500/20',
    },
    {
        id: 'elogio',
        label: 'Elogio',
        icon: <Heart size={18} />,
        color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
        activeColor: 'text-pink-300 border-pink-400 bg-pink-500/30 shadow-pink-500/20',
    },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user }) => {
    const [category, setCategory] = useState<Category>('sugestao');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCategory('sugestao');
            setName(user?.user_metadata?.display_name || user?.email?.split('@')[0] || '');
            setMessage('');
            setLoading(false);
            setSent(false);
        }
    }, [isOpen, user]);

    const canSubmit = message.trim().length > 0 && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('feedback').insert({
                category,
                name: name.trim() || null,
                message: message.trim(),
                user_id: user?.id || null,
            });

            if (error) throw error;

            setSent(true);
            toast.success('Feedback enviado! Obrigado 🙏');
            setTimeout(onClose, 1800);
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-indigo-900 border border-indigo-700 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="h-28 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                        </div>
                        <div className="flex flex-col items-center gap-2 z-10">
                            <MessageSquare size={36} className="text-yellow-400 drop-shadow-lg" strokeWidth={2} />
                            <h2 className="text-xl font-black text-white tracking-tight">Enviar Feedback</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center gap-4 py-14 px-8"
                        >
                            <span className="text-5xl">🙏</span>
                            <p className="text-white font-bold text-lg">Obrigado pelo feedback!</p>
                            <p className="text-indigo-300 text-sm text-center">Sua mensagem nos ajuda a melhorar o app.</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 pt-5 space-y-4">
                            {/* Category Selector */}
                            <div>
                                <label className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-2">
                                    Tipo de feedback
                                </label>
                                <div className="flex gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-bold transition-all ${category === cat.id
                                                    ? cat.activeColor + ' shadow-lg'
                                                    : cat.color + ' hover:opacity-80'
                                                }`}
                                        >
                                            {cat.icon}
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-2">
                                    Nome <span className="normal-case font-normal">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Como quer ser identificado?"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={60}
                                    className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-3.5 px-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-sm"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-2">
                                    Mensagem <span className="text-pink-400">*</span>
                                </label>
                                <textarea
                                    placeholder={
                                        category === 'erro'
                                            ? 'Descreva o erro que encontrou...'
                                            : category === 'sugestao'
                                                ? 'Qual melhoria você sugere?'
                                                : 'O que você está gostando?'
                                    }
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    maxLength={1000}
                                    className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-3.5 px-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium text-sm resize-none"
                                />
                                <p className="text-right text-xs text-indigo-500 mt-1">{message.length}/1000</p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-indigo-950 font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Enviar Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

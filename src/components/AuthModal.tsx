import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase';
import { X, Mail, Lock, UserPlus, LogIn, Loader2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const translateAuthError = (message: string): string => {
    const errorMap: Record<string, string> = {
        'User already registered': 'Este e-mail já está cadastrado.',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
        'Invalid email or password': 'E-mail ou senha inválidos.',
        'User not found': 'Usuário não encontrado.',
        'Email already in use': 'Este e-mail já está em uso.',
        'Too many requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'Database error saving new user': 'Erro ao salvar o usuário. Tente novamente.',
        'Signup requires a valid password': 'Por favor, insira uma senha válida.',
        'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
    };

    for (const [key, value] of Object.entries(errorMap)) {
        if (message.includes(key)) return value;
    }
    return 'Erro na autenticação. Tente novamente.';
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Bem-vindo de volta!');
                onClose();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Conta criada com sucesso!');
                onClose();
            }
        } catch (error: any) {
            toast.error(translateAuthError(error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-indigo-900 border border-indigo-700 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header Image/Pattern */}
                    <div className="h-32 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                        </div>
                        <div className="flex flex-col items-center gap-2 z-10">
                            <BookOpen size={40} className="text-yellow-400 drop-shadow-lg" strokeWidth={2.5} />
                            <h2 className="text-2xl font-black text-white tracking-tight italic">
                                {isLogin ? 'Bem-vindo!' : 'Crie sua Conta'}
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                                <input
                                    type="email"
                                    placeholder="Seu melhor e-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                                <input
                                    type="password"
                                    placeholder="Sua senha secreta"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-indigo-950 font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : isLogin ? (
                                <>
                                    <LogIn size={20} />
                                    Entrar no Universo
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Começar Jornada
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-indigo-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1 mx-auto"
                            >
                                {isLogin ? (
                                    <>Não tem uma conta? <span className="text-yellow-400">Inscreva-se</span></>
                                ) : (
                                    <>Já faz parte? <span className="text-yellow-400">Faça login</span></>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Decorative Footer */}
                    <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

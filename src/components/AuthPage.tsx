import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase';
import { Mail, Lock, UserPlus, LogIn, Loader2, BookOpen, KeyRound, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

type AuthView = 'login' | 'signup' | 'forgot';

interface AuthPageProps {
    onGuestEntry: () => void;
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

export const AuthPage: React.FC<AuthPageProps> = ({ onGuestEntry }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success('Bem-vindo de volta!');
            } else if (view === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success('Conta criada com sucesso!');
            } else if (view === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
                setView('login');
            }
        } catch (error: any) {
            toast.error(translateAuthError(error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const titles: Record<AuthView, string> = {
        login: 'Bem-vindo ao MemorizaBíblia!',
        signup: 'Crie sua Conta Grátis',
        forgot: 'Recuperar Senha',
    };

    const subtitles: Record<AuthView, string> = {
        login: 'Entre para continuar sua jornada de memorização.',
        signup: 'Comece agora a guardar a Palavra no seu coração.',
        forgot: 'Enviaremos um link para resetar sua senha.',
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-indigo-950 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-pulse" />
                <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-30" />
            </div>

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-md bg-indigo-900/40 backdrop-blur-xl border border-indigo-700/50 rounded-[2rem] overflow-hidden shadow-2xl z-10"
            >
                {/* Header */}
                <div className="p-8 pb-4 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-indigo-800/50 rounded-2xl ring-1 ring-indigo-700/50 shadow-inner">
                            {view === 'forgot' ? (
                                <KeyRound size={48} className="text-yellow-400 drop-shadow-lg" strokeWidth={1.5} />
                            ) : (
                                <BookOpen size={48} className="text-yellow-400 drop-shadow-lg" strokeWidth={2} />
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">
                        {titles[view]}
                    </h1>
                    <p className="text-indigo-200 font-medium">
                        {subtitles[view]}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
                    <div className="space-y-4">
                        {/* Email */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-yellow-400 transition-colors" size={20} />
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-400/50 outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all font-medium"
                                required
                            />
                        </div>

                        {/* Password - hidden on forgot view */}
                        {view !== 'forgot' && (
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-yellow-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Sua senha secreta"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-400/50 outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all font-medium"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-indigo-950 font-black py-4 rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-tight text-sm"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : view === 'login' ? (
                            <><LogIn size={20} /> Entrar Agora</>
                        ) : view === 'signup' ? (
                            <><UserPlus size={20} /> Criar Conta Grátis</>
                        ) : (
                            <><KeyRound size={20} /> Recuperar Acesso</>
                        )}
                    </button>

                    {/* Guest Access Option */}
                    {view === 'login' && (
                        <div className="pt-2">
                            <div className="flex items-center gap-3 my-4">
                                <div className="h-px bg-indigo-800/80 flex-1" />
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Ou</span>
                                <div className="h-px bg-indigo-800/80 flex-1" />
                            </div>

                            <button
                                type="button"
                                onClick={onGuestEntry}
                                className="w-full bg-indigo-800/40 hover:bg-indigo-800/60 text-indigo-100 font-bold py-4 rounded-2xl border border-indigo-700/50 transition-all flex items-center justify-center gap-2 text-sm group"
                            >
                                Experimentar sem conta <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="mt-4 text-xs text-indigo-300/80 text-center leading-relaxed px-4">
                                <strong className="text-yellow-400/90 font-bold">Dica:</strong> Crie sua conta gratuitamente para garantir que seu progresso e conquistas fiquem <span className="text-white italic">salvos para sempre</span> em qualquer dispositivo.
                            </p>
                        </div>
                    )}

                    {/* Links */}
                    <div className="flex flex-col items-center gap-3 text-center pt-2">
                        {view === 'login' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setView('signup')}
                                    className="text-indigo-200 hover:text-white text-sm font-bold transition-colors"
                                >
                                    Novo por aqui? <span className="text-yellow-400 border-b border-yellow-400/30">Crie sua conta grátis</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView('forgot')}
                                    className="text-indigo-400 hover:text-indigo-200 text-xs font-bold transition-colors"
                                >
                                    Esqueceu a senha?
                                </button>
                            </>
                        )}
                        {view === 'signup' && (
                            <button
                                type="button"
                                onClick={() => setView('login')}
                                className="text-indigo-200 hover:text-white text-sm font-bold transition-colors"
                            >
                                Já possui conta? <span className="text-yellow-400 border-b border-yellow-400/30">Faça login</span>
                            </button>
                        )}
                        {view === 'forgot' && (
                            <button
                                type="button"
                                onClick={() => setView('login')}
                                className="text-indigo-200 hover:text-white text-sm font-bold transition-colors"
                            >
                                Lembrou a senha? <span className="text-yellow-400 border-b border-yellow-400/30">Voltar ao login</span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Decorative Footer */}
                <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
            </motion.div>

            {/* Simple footer */}
            <p className="mt-8 text-indigo-400/60 text-xs font-medium tracking-tight">
                MemorizaBíblia &copy; {new Date().getFullYear()} • Guarde a Palavra
            </p>
        </div>
    );
};

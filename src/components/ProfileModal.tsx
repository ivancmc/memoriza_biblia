import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase';
import { X, User, Lock, Loader2, CheckCircle2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: SupabaseUser;
}

type Tab = 'profile' | 'password';

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDisplayName(user.user_metadata?.display_name || '');
            setNewPassword('');
            setConfirmPassword('');
            setActiveTab('profile');
        }
    }, [isOpen, user]);

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            toast.error('Por favor, insira um nome.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: displayName.trim() },
            });
            if (error) throw error;
            toast.success('Nome atualizado com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao salvar o nome. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Senha alterada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error('Erro ao alterar senha. Tente novamente.');
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
                    {/* Header */}
                    <div className="h-28 bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                        </div>
                        <div className="flex flex-col items-center gap-2 z-10">
                            <Settings size={36} className="text-yellow-400 drop-shadow-lg" strokeWidth={2} />
                            <h2 className="text-xl font-black text-white tracking-tight">Meu Perfil</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Email info */}
                    <div className="px-8 pt-5 pb-1">
                        <p className="text-xs text-indigo-400 font-medium uppercase tracking-widest">Conta</p>
                        <p className="text-sm text-indigo-200 font-semibold mt-1 truncate">{user.email}</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex mx-8 mt-4 bg-indigo-950/50 rounded-2xl p-1 gap-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile'
                                    ? 'bg-indigo-700 text-white shadow'
                                    : 'text-indigo-400 hover:text-white'
                                }`}
                        >
                            <User size={16} />
                            Nome
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'password'
                                    ? 'bg-indigo-700 text-white shadow'
                                    : 'text-indigo-400 hover:text-white'
                                }`}
                        >
                            <Lock size={16} />
                            Senha
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8 pt-5">
                        {activeTab === 'profile' ? (
                            <form onSubmit={handleSaveName} className="space-y-4">
                                <div>
                                    <label className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-2">
                                        Nome de exibição
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Como quer ser chamado?"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            maxLength={40}
                                            className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-indigo-950 font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Salvar Nome
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Nova senha"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                    <input
                                        type="password"
                                        placeholder="Confirmar nova senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-indigo-950/50 border border-indigo-700/50 rounded-2xl py-4 pl-11 pr-4 text-white placeholder-indigo-400 outline-none focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-indigo-950 font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Alterar Senha
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

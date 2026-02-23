import React from 'react';
import { Download, X } from 'lucide-react';

interface InstallPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInstall: () => void;
}

const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose, onInstall }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl shadow-2xl overflow-hidden border border-indigo-500/30 animate-in zoom-in-95 duration-300"
            >
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-400/20 shadow-inner group transition-transform hover:scale-110 duration-300">
                        <Download className="text-indigo-400 group-hover:text-indigo-300" size={40} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Instale o MemorizaBíblia
                    </h2>

                    <p className="text-indigo-200/80 mb-8 leading-relaxed">
                        Instale nosso aplicativo para ter acesso rápido, offline e uma experiência muito mais divertida direto na sua tela inicial!
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={() => {
                                onInstall();
                                onClose();
                            }}
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            Instalar Agora
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-6 text-indigo-300 hover:text-white font-medium transition-colors"
                        >
                            Talvez mais tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPromptModal;

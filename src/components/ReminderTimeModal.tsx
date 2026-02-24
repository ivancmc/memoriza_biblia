import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X, Check, ChevronDown } from 'lucide-react';

interface ReminderTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (hour: number, minute: number) => void;
    initialHour: number;
    initialMinute: number;
}

const ReminderTimeModal: React.FC<ReminderTimeModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialHour,
    initialMinute
}) => {
    const [hour, setHour] = useState(initialHour);
    const [minute, setMinute] = useState(initialMinute);

    if (!isOpen) return null;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl shadow-2xl overflow-hidden border border-indigo-500/30 animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-400/20 shadow-inner group transition-transform hover:scale-110 duration-300">
                            <Clock className="text-indigo-400 group-hover:text-indigo-300" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Hora do lembrete</h2>
                        <p className="text-indigo-200/70 text-sm">Escolha o melhor horário para praticar seus versículos.</p>
                    </div>

                    <div className="flex justify-center items-center gap-4 mb-8">
                        {/* Hour Selection */}
                        <div className="flex flex-col items-center">
                            <label htmlFor="reminder-hour" className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Hora</label>
                            <div className="relative">
                                <select
                                    id="reminder-hour"
                                    value={hour}
                                    onChange={(e) => setHour(parseInt(e.target.value))}
                                    className="bg-slate-800/80 text-white text-2xl font-bold py-3 pl-4 pr-10 rounded-2xl border border-indigo-500/30 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer text-center min-w-[100px]"
                                >
                                    {hours.map((h) => (
                                        <option key={h} value={h} className="bg-slate-900 text-white">
                                            {h.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="text-2xl font-bold text-indigo-400 mt-6">:</div>

                        {/* Minute Selection */}
                        <div className="flex flex-col items-center">
                            <label htmlFor="reminder-minute" className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Minutos</label>
                            <div className="relative">
                                <select
                                    id="reminder-minute"
                                    value={minute}
                                    onChange={(e) => setMinute(parseInt(e.target.value))}
                                    className="bg-slate-800/80 text-white text-2xl font-bold py-3 pl-4 pr-10 rounded-2xl border border-indigo-500/30 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer text-center min-w-[100px]"
                                >
                                    {minutes.map((m) => (
                                        <option key={m} value={m} className="bg-slate-900 text-white">
                                            {m.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onSave(hour, minute)}
                        className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        Salvar horário
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReminderTimeModal;

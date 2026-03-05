import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Zap, Trophy, ChevronRight, X } from 'lucide-react';

const ONBOARDING_KEY = 'memoriza_biblia_onboarded';

export function useOnboarding() {
    const [show, setShow] = useState(() => {
        return localStorage.getItem(ONBOARDING_KEY) !== 'true';
    });

    const dismiss = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShow(false);
    };

    return { show, dismiss };
}

const slides = [
    {
        icon: <BookOpen size={48} className="text-yellow-400" />,
        bg: 'from-indigo-900 to-indigo-950',
        accent: 'from-yellow-400 to-orange-500',
        title: 'Bem-vindo ao\nMemorizaBíblia',
        body: 'Seu companheiro diário para gravar a Palavra de Deus no coração.',
    },
    {
        icon: <Calendar size={48} className="text-sky-400" />,
        bg: 'from-indigo-950 to-slate-900',
        accent: 'from-sky-400 to-indigo-500',
        title: 'Um desafio\npor dia',
        body: 'Cada dia traz um novo desafio para memorizar um versículo. Abra o app todos os dias e avance pelos estágios de memorização.',
    },
    {
        icon: <Zap size={48} className="text-pink-400" />,
        bg: 'from-slate-900 to-purple-950',
        accent: 'from-pink-400 to-purple-500',
        title: 'Estágios\nprogressivos',
        body: 'Do texto completo à reconstituição da memória, cada etapa treina seu cérebro de forma diferente.',
    },
    {
        icon: <Trophy size={48} className="text-yellow-400" />,
        bg: 'from-purple-950 to-indigo-950',
        accent: 'from-yellow-400 to-orange-500',
        title: 'Conquistas &\nsequência diária',
        body: 'Mantenha sua sequência, desbloqueie conquistas e veja o progresso crescer dia após dia.',
    },
];

interface Props {
    onDismiss: () => void;
}

export function OnboardingModal({ onDismiss }: Props) {
    const [step, setStep] = useState(0);
    const isLast = step === slides.length - 1;
    const slide = slides[step];

    const next = () => {
        if (isLast) {
            onDismiss();
        } else {
            setStep(s => s + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Card */}
            <motion.div
                key={step}
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className={`relative w-full sm:max-w-sm mx-auto bg-gradient-to-b ${slide.bg} rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10`}
                style={{ minHeight: 380 }}
            >
                {/* Skip button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 text-indigo-400 hover:text-white transition-colors p-1"
                    aria-label="Pular introdução"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center px-8 pt-12 pb-8 gap-6 text-center">
                    {/* Icon blob */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"
                    >
                        {slide.icon}
                    </motion.div>

                    {/* Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 }}
                        className="flex flex-col gap-3"
                    >
                        <h2 className="text-2xl font-bold text-white leading-tight whitespace-pre-line">
                            {slide.title}
                        </h2>
                        <p className="text-indigo-300 text-sm leading-relaxed">
                            {slide.body}
                        </p>
                    </motion.div>

                    {/* Step dots */}
                    <div className="flex gap-2 mt-1">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === step
                                    ? `w-6 bg-gradient-to-r ${slide.accent}`
                                    : 'w-1.5 bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* CTA Button */}
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={next}
                        className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${slide.accent} text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all`}
                    >
                        {isLast ? 'Começar agora!' : 'Próximo'}
                        {!isLast && <ChevronRight size={18} />}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

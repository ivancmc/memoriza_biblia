import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, BookOpen, PlayCircle, Loader2, Info } from 'lucide-react';
import { Verse } from '../store';
import { supabase } from '../services/supabase';
import { offlineVerses } from '../data/verses';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartMemorization: (verse: Verse) => void;
}

function mapDbVerse(v: Record<string, unknown>): Verse {
    return {
        reference: v.reference as string,
        text: v.text as string,
        explanation: v.explanation as string,
        bookContext: v.book_context as string,
        keywords: v.keywords as string[],
        emojiText: v.emoji_text as string,
        scrambled: v.scrambled as string[],
        fakeReferences: v.fake_references as string[],
    };
}

const normalizeText = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onStartMemorization }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Verse[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
            setHasSearched(false);
        }
    }, [isOpen]);

    const performSearch = useCallback(async (searchTerm: string) => {
        const term = searchTerm.trim();
        if (!term) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            // Use RPC to handle unaccented search in Postgres
            const { data, error } = await supabase
                .rpc('search_verses', { search_term: term });

            if (!error && data) {
                setIsOffline(false);
                setResults(data.map(mapDbVerse));
            } else {
                throw new Error(error?.message || 'Supabase unavailable');
            }
        } catch (err) {
            console.error('Search error:', err);
            // Fallback: search offline verses
            setIsOffline(true);
            const normalizedTerm = normalizeText(term);
            const filtered = offlineVerses.filter(
                v =>
                    normalizeText(v.reference).includes(normalizedTerm) ||
                    normalizeText(v.text).includes(normalizedTerm)
            );
            setResults(filtered.slice(0, 30));
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 400);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            performSearch(query);
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleStartMemorization = (verse: Verse) => {
        onStartMemorization(verse);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-indigo-500/20 bg-indigo-950/60">
                            <div className="flex items-center gap-3 text-yellow-400">
                                <Search size={22} />
                                <h2 className="text-xl font-bold text-white">Buscar Versículo</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-indigo-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="px-6 py-4 bg-indigo-950/30 border-b border-indigo-500/20">
                            <div className="relative">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ex: João 3:16 ou &quot;Deus amou o mundo&quot;..."
                                    className="w-full bg-indigo-900/50 border border-indigo-700/60 rounded-xl pl-10 pr-10 py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30 transition-all"
                                />
                                {isSearching && (
                                    <Loader2
                                        size={18}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin"
                                    />
                                )}
                            </div>

                            {/* Disclaimer */}
                            <div className="flex items-start gap-2 mt-3 px-1">
                                <Info size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-indigo-400 leading-relaxed">
                                    Esta busca não pesquisa na bíblia completa. Apenas nos{' '}
                                    <span className="text-yellow-400/80 font-medium">{offlineVerses.length}+ versículos</span>{' '}
                                    disponibilizados para memorização neste app.
                                    {isOffline && (
                                        <span className="text-orange-400 ml-1">(Modo offline)</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {!hasSearched && !query && (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-indigo-400">
                                    <BookOpen size={48} className="mb-4 opacity-40" />
                                    <p className="text-center text-sm opacity-70">
                                        Digite uma referência (ex: "João 3") ou parte do texto do versículo
                                    </p>
                                </div>
                            )}

                            {hasSearched && !isSearching && results.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-indigo-400">
                                    <Search size={48} className="mb-4 opacity-40" />
                                    <p className="font-medium">Nenhum versículo encontrado</p>
                                    <p className="text-sm mt-1 opacity-70">Tente outro termo ou referência</p>
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="p-4 space-y-3">
                                    <p className="text-xs text-indigo-400 px-2">
                                        {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                                    </p>
                                    {results.map((verse, index) => (
                                        <motion.div
                                            key={verse.reference}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className="group bg-indigo-950/40 border border-indigo-500/20 hover:border-indigo-400/40 rounded-xl p-4 transition-all hover:bg-indigo-950/60"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <span className="inline-block text-yellow-400 font-bold text-sm mb-1.5">
                                                        {verse.reference}
                                                    </span>
                                                    <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                                                        "{verse.text}"
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleStartMemorization(verse)}
                                                    title="Iniciar memorização deste versículo"
                                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 hover:from-yellow-400/30 hover:to-orange-400/30 hover:border-yellow-400/60 text-yellow-300 hover:text-yellow-200 rounded-xl transition-all text-xs font-semibold whitespace-nowrap"
                                                >
                                                    <PlayCircle size={15} />
                                                    <span className="hidden sm:inline">Memorizar</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 flex-shrink-0" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, PlayCircle, Loader2, Info, ArrowLeft } from 'lucide-react';
import { Verse, useStore } from '../store';
import { supabase } from '../services/supabase';
import { offlineVerses } from '../data/verses';

interface SearchPageProps {
    onBack: () => void;
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

export const SearchPage: React.FC<SearchPageProps> = ({ onBack, onStartMemorization }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Verse[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when page loads
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

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
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full w-full max-w-2xl mx-auto bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 md:p-8 shadow-2xl border border-indigo-500/20"
        >
            {/* Header */}
            <div className="flex items-center gap-3 md:gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-full text-indigo-300 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} className="md:w-6 md:h-6" />
                </button>
                <div className="flex items-center gap-2 md:gap-3 text-yellow-400">
                    <Search size={20} className="md:w-6 md:h-6" />
                    <h2 className="text-xl md:text-2xl font-bold text-white">Buscar Versículo</h2>
                </div>
            </div>

            {/* Search Input */}
            <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 mb-6">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ex: João 3:16..."
                        className="w-full bg-indigo-900/50 border border-indigo-700/60 rounded-xl pl-11 pr-11 py-2.5 md:py-3 text-white placeholder-indigo-400 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30 transition-all font-medium text-sm md:text-base"
                    />
                    {isSearching && (
                        <Loader2
                            size={18}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin"
                        />
                    )}
                </div>

                <div className="flex items-start gap-2 mt-3 px-1">
                    <Info size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-indigo-400 leading-relaxed">
                        Pesquisando em <span className="text-yellow-400/80 font-medium">{offlineVerses.length}+ versículos da NVI</span>.{' '}
                        {isOffline && <span className="text-orange-400">(Modo offline)</span>}
                    </p>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
                {!hasSearched && !query && (
                    <div className="flex flex-col items-center justify-center py-12 text-indigo-400/50 text-center">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p className="text-base md:text-lg">Comece a digitar para encontrar versículos</p>
                    </div>
                )}

                {hasSearched && !isSearching && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-indigo-400/50 text-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p className="text-base md:text-lg font-medium">Nenhum resultado encontrado</p>
                        <p className="text-xs md:text-sm">Tente termos diferentes ou uma referência específica</p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="space-y-3 md:space-y-4 pb-8">
                        <p className="text-[11px] md:text-sm text-indigo-400 font-medium mb-1">
                            {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                        </p>
                        {results.map((verse, index) => (
                            <motion.div
                                key={verse.reference}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="group bg-indigo-950/30 border border-indigo-500/20 hover:border-yellow-400/40 rounded-2xl p-4 md:p-5 transition-all hover:bg-indigo-950/50"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                    <div className="flex-1">
                                        <span className="inline-block text-yellow-400 font-bold text-base md:text-lg mb-1">
                                            {verse.reference}
                                        </span>
                                        <p className="text-slate-300 text-sm md:text-base leading-relaxed italic line-clamp-3 sm:line-clamp-none">
                                            "{verse.text}"
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onStartMemorization(verse)}
                                        className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-indigo-950 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/10 active:scale-95 text-sm md:text-base"
                                    >
                                        <PlayCircle size={18} />
                                        <span>Memorizar</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

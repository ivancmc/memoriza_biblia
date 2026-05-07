import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, PlayCircle, Loader2, Info, ArrowLeft, Eye, X, Check, BookMarked, Smile, Tag, Type, Shuffle, Quote } from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';
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
    const { isAdmin } = useStore();
    const [isOffline, setIsOffline] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(offlineVerses.length);
    const [editingVerse, setEditingVerse] = useState<Verse | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Estados para edição
    const [editExplanation, setEditExplanation] = useState('');
    const [editBookContext, setEditBookContext] = useState('');
    const [editEmojiText, setEditEmojiText] = useState('');

    useEffect(() => {
        if (editingVerse) {
            setEditExplanation(editingVerse.explanation);
            setEditBookContext(editingVerse.bookContext);
            setEditEmojiText(editingVerse.emojiText);
        }
    }, [editingVerse]);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Focus input when page loads
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);

        const fetchTotalCount = async () => {
            if (navigator.onLine) {
                try {
                    const { count, error } = await supabase
                        .from('verses')
                        .select('*', { count: 'exact', head: true });

                    if (!error && count !== null) {
                        setTotalCount(count);
                    }
                } catch (err) {
                    console.error('Error fetching total count:', err);
                }
            }
        };

        fetchTotalCount();
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

    const handleSaveEdit = async () => {
        if (!editingVerse) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('verses')
                .update({
                    explanation: editExplanation,
                    book_context: editBookContext,
                    emoji_text: editEmojiText,
                })
                .eq('reference', editingVerse.reference);

            if (error) throw error;

            toast.success('Versículo atualizado com sucesso!');
            setEditingVerse(null);
            // Atualiza o resultado localmente se estiver na lista
            setResults(prev => prev.map(v => 
                v.reference === editingVerse.reference 
                    ? { ...v, explanation: editExplanation, bookContext: editBookContext, emojiText: editEmojiText }
                    : v
            ));
        } catch (err: any) {
            console.error('Error saving verse:', err);
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    };

    if (editingVerse) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full w-full max-w-2xl mx-auto bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 md:p-8 shadow-2xl border border-indigo-500/20"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setEditingVerse(null)}
                            className="p-2 hover:bg-white/10 rounded-full text-indigo-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Editar Versículo</h2>
                    </div>
                    <button
                        onClick={() => setEditingVerse(null)}
                        className="p-2 hover:bg-white/10 rounded-full text-indigo-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2 space-y-6">
                    <div className="bg-indigo-950/40 border border-yellow-400/30 rounded-2xl p-4 md:p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Quote size={16} className="text-yellow-400" />
                            <span className="text-yellow-400 font-bold text-base md:text-lg">{editingVerse.reference}</span>
                        </div>
                        <p className="text-slate-200 text-sm md:text-base leading-relaxed italic">
                            "{editingVerse.text}"
                        </p>
                    </div>

                    <div className="space-y-5">
                        <EditableField
                            icon={<BookMarked size={16} />}
                            label="Explicação"
                            value={editExplanation}
                            onChange={setEditExplanation}
                        />

                        <EditableField
                            icon={<BookOpen size={16} />}
                            label="Contexto do Livro"
                            value={editBookContext}
                            onChange={setEditBookContext}
                        />

                        <EditableField
                            icon={<Smile size={16} />}
                            label="Texto com Emojis"
                            value={editEmojiText}
                            onChange={setEditEmojiText}
                        />

                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setEditingVerse(null)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700/50 text-sm md:text-base"
                    >
                        <X size={18} />
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-50 shadow-lg shadow-green-500/20 text-sm md:text-base"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        );
    }

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
                        Pesquisando em <span className="text-yellow-400/80 font-medium">
                            {(!isOffline && totalCount > 0) ? totalCount : offlineVerses.length} versículos da NVI
                        </span>.{' '}
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
                                    <div className="flex flex-col gap-2 w-full sm:w-48 mt-3 sm:mt-0">
                                        {isAdmin && !isOffline && (
                                            <button
                                                onClick={() => setEditingVerse(verse)}
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-700/60 text-white rounded-xl font-bold hover:bg-indigo-600/70 transition-all active:scale-95 text-xs md:text-sm border border-indigo-500/30"
                                            >
                                                <Eye size={16} />
                                                <span>Ver Detalhes</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onStartMemorization(verse)}
                                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-yellow-400 text-indigo-950 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/10 active:scale-95 text-xs md:text-sm"
                                        >
                                            <PlayCircle size={16} />
                                            <span>Memorizar</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Componente auxiliar para campos editáveis (reutilizado)
function EditableField({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: string; onChange: (val: string) => void }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-yellow-400">{icon}</span>
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">{label}</span>
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-indigo-900/30 text-slate-200 text-sm md:text-base leading-relaxed rounded-xl px-3 py-2 border border-indigo-700/40 focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30 transition-all resize-none min-h-[100px]"
                rows={3}
            />
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, Sparkles, RefreshCw, Check, Loader2,
  BookOpen, ChevronDown, AlertCircle, Tag, Type, Smile, Shuffle, BookMarked, Quote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBooks, getChapterCount, getVerseCount, getVerseText, formatReference } from '../data/bibleData';
import { generateVerseContent } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { Verse } from '../store';

interface AddVersePageProps {
  onBack: () => void;
}

type Step = 'select' | 'preview' | 'saved';

export const AddVersePage: React.FC<AddVersePageProps> = ({ onBack }) => {
  // Step 1 — Seleção
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState(0);
  const [verseText, setVerseText] = useState('');
  const [reference, setReference] = useState('');

  // Step 2 — Geração
  const [generatedVerse, setGeneratedVerse] = useState<Verse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<Step>('select');

  const books = useMemo(() => getBooks(), []);
  const chapterCount = useMemo(() => selectedBook ? getChapterCount(selectedBook) : 0, [selectedBook]);
  const verseCount = useMemo(() => selectedBook && selectedChapter ? getVerseCount(selectedBook, selectedChapter) : 0, [selectedBook, selectedChapter]);

  const handleBookChange = (abbrev: string) => {
    setSelectedBook(abbrev);
    setSelectedChapter(0);
    setSelectedVerse(0);
    setVerseText('');
    setGeneratedVerse(null);
    setStep('select');
  };

  const handleChapterChange = (ch: number) => {
    setSelectedChapter(ch);
    setSelectedVerse(0);
    setVerseText('');
    setGeneratedVerse(null);
    setStep('select');
  };

  const handleVerseChange = (v: number) => {
    setSelectedVerse(v);
    setVerseText('');
    setGeneratedVerse(null);
    setStep('select');
  };

  const handleSearch = () => {
    if (!selectedBook || !selectedChapter || !selectedVerse) {
      toast.error('Selecione livro, capítulo e versículo');
      return;
    }
    const text = getVerseText(selectedBook, selectedChapter, selectedVerse);
    if (!text) {
      toast.error('Versículo não encontrado');
      return;
    }
    setVerseText(text);
    setReference(formatReference(selectedBook, selectedChapter, selectedVerse));
  };

  const handleGenerate = async () => {
    if (!verseText || !reference) return;
    setIsGenerating(true);
    try {
      const verse = await generateVerseContent(reference, verseText);
      setGeneratedVerse(verse);
      setStep('preview');
    } catch (err: any) {
      console.error('Erro ao gerar conteúdo:', err);
      toast.error(err?.message || 'Erro ao gerar conteúdo com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!verseText || !reference) return;
    setIsGenerating(true);
    try {
      const verse = await generateVerseContent(reference, verseText);
      setGeneratedVerse(verse);
      toast.success('Conteúdo gerado novamente!');
    } catch (err: any) {
      console.error('Erro ao regerar:', err);
      toast.error(err?.message || 'Erro ao regerar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedVerse) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('verses').insert({
        reference: generatedVerse.reference,
        text: generatedVerse.text,
        explanation: generatedVerse.explanation,
        book_context: generatedVerse.bookContext,
        keywords: generatedVerse.keywords,
        emoji_text: generatedVerse.emojiText,
        scrambled: generatedVerse.scrambled,
        fake_references: generatedVerse.fakeReferences,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este versículo já existe no banco de dados!');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Versículo adicionado com sucesso! ✨');
      setStep('saved');

      // Reset após 2 segundos
      setTimeout(() => {
        setSelectedBook('');
        setSelectedChapter(0);
        setSelectedVerse(0);
        setVerseText('');
        setReference('');
        setGeneratedVerse(null);
        setStep('select');
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast.error(err?.message || 'Erro ao salvar no banco de dados');
    } finally {
      setIsSaving(false);
    }
  };

  const selectClass = "w-full bg-indigo-900/50 border border-indigo-700/60 rounded-xl px-4 py-2.5 md:py-3 text-white focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/30 transition-all font-medium text-sm md:text-base appearance-none cursor-pointer";

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
          <BookOpen size={20} className="md:w-6 md:h-6" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Adicionar Versículo</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2 space-y-5">

        {/* === STEP 1: Seleção do versículo === */}
        <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 md:p-5">
          <h3 className="text-sm md:text-base font-semibold text-indigo-300 mb-4 flex items-center gap-2">
            <Search size={16} />
            <span>1. Selecione o versículo</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Livro */}
            <div className="relative">
              <label className="block text-xs text-indigo-400 mb-1.5 font-medium">Livro</label>
              <div className="relative">
                <select
                  value={selectedBook}
                  onChange={e => handleBookChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione...</option>
                  {books.map(b => (
                    <option key={b.abbrev} value={b.abbrev}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              </div>
            </div>

            {/* Capítulo */}
            <div className="relative">
              <label className="block text-xs text-indigo-400 mb-1.5 font-medium">Capítulo</label>
              <div className="relative">
                <select
                  value={selectedChapter}
                  onChange={e => handleChapterChange(Number(e.target.value))}
                  disabled={!selectedBook}
                  className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <option value={0}>Selecione...</option>
                  {Array.from({ length: chapterCount }, (_, i) => i + 1).map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              </div>
            </div>

            {/* Versículo */}
            <div className="relative">
              <label className="block text-xs text-indigo-400 mb-1.5 font-medium">Versículo</label>
              <div className="relative">
                <select
                  value={selectedVerse}
                  onChange={e => handleVerseChange(Number(e.target.value))}
                  disabled={!selectedChapter}
                  className={`${selectClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <option value={0}>Selecione...</option>
                  {Array.from({ length: verseCount }, (_, i) => i + 1).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Botão buscar */}
          <button
            onClick={handleSearch}
            disabled={!selectedBook || !selectedChapter || !selectedVerse}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-700/60 hover:bg-indigo-600/70 text-white rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm md:text-base"
          >
            <Search size={16} />
            Buscar versículo
          </button>
        </div>

        {/* Texto encontrado */}
        <AnimatePresence>
          {verseText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-indigo-950/40 border border-yellow-400/30 rounded-2xl p-4 md:p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Quote size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold text-base md:text-lg">{reference}</span>
              </div>
              <p className="text-slate-200 text-sm md:text-base leading-relaxed italic">
                "{verseText}"
              </p>

              {/* Botão gerar */}
              {!generatedVerse && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-950 rounded-xl font-bold hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-60 text-sm md:text-base shadow-lg shadow-yellow-400/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Gerando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Gerar conteúdo com IA
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === STEP 2: Preview do conteúdo gerado === */}
        <AnimatePresence>
          {generatedVerse && step !== 'saved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 md:p-5">
                <h3 className="text-sm md:text-base font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span>2. Conteúdo gerado</span>
                  {isGenerating && <Loader2 size={14} className="animate-spin text-yellow-400" />}
                </h3>

                <div className={`space-y-4 ${isGenerating ? 'opacity-40 pointer-events-none' : ''}`}>
                  {/* Explicação */}
                  <PreviewField
                    icon={<BookMarked size={14} />}
                    label="Explicação"
                    value={generatedVerse.explanation}
                  />

                  {/* Contexto do Livro */}
                  <PreviewField
                    icon={<BookOpen size={14} />}
                    label="Contexto do Livro"
                    value={generatedVerse.bookContext}
                  />

                  {/* Palavras-chave */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Tag size={14} className="text-yellow-400" />
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Palavras-chave</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedVerse.keywords.map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 rounded-lg text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Texto com Emojis */}
                  <PreviewField
                    icon={<Smile size={14} />}
                    label="Texto com Emojis"
                    value={generatedVerse.emojiText}
                  />

                  {/* Palavras Embaralhadas */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Shuffle size={14} className="text-yellow-400" />
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Palavras Embaralhadas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedVerse.scrambled.map((word, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-800/50 border border-indigo-600/30 text-indigo-200 rounded-lg text-xs font-mono">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Referências Falsas */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Type size={14} className="text-yellow-400" />
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Referências Falsas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedVerse.fakeReferences.map((ref, i) => (
                        <span key={i} className="px-2.5 py-1 bg-pink-500/10 border border-pink-400/20 text-pink-300 rounded-lg text-xs font-medium">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-700/60 hover:bg-indigo-600/70 text-white rounded-xl font-semibold transition-all disabled:opacity-40 text-sm md:text-base"
                >
                  <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                  Regerar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isGenerating || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-400 hover:to-emerald-500 transition-all disabled:opacity-40 text-sm md:text-base shadow-lg shadow-green-500/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === STEP 3: Salvo com sucesso === */}
        <AnimatePresence>
          {step === 'saved' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-green-900/30 border border-green-500/30 rounded-2xl p-6 md:p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-green-300 mb-2">Versículo adicionado!</h3>
              <p className="text-green-400/70 text-sm">O formulário será limpo em instantes...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info box se nenhum passo ativo */}
        {!verseText && (
          <div className="flex items-start gap-3 p-4 bg-indigo-950/30 border border-indigo-500/10 rounded-2xl">
            <AlertCircle size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs md:text-sm text-indigo-400 leading-relaxed">
              <p className="font-medium text-indigo-300 mb-1">Como funciona:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Selecione o livro, capítulo e versículo</li>
                <li>O texto será buscado na versão NVI</li>
                <li>A IA gerará o conteúdo para memorização</li>
                <li>Revise e adicione ao banco de dados</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente auxiliar para campos de preview
function PreviewField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-yellow-400">{icon}</span>
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-slate-300 text-sm md:text-base leading-relaxed bg-indigo-900/30 rounded-xl px-3 py-2 border border-indigo-700/20">
        {value}
      </p>
    </div>
  );
}

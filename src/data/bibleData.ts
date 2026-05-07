import nviData from './nvi.json';

export interface BibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

// Mapa de abreviações → nome completo em PT-BR
const bookNames: Record<string, string> = {
  gn: 'Gênesis', ex: 'Êxodo', lv: 'Levítico', nm: 'Números', dt: 'Deuteronômio',
  js: 'Josué', jz: 'Juízes', rt: 'Rute', '1sm': '1 Samuel', '2sm': '2 Samuel',
  '1rs': '1 Reis', '2rs': '2 Reis', '1cr': '1 Crônicas', '2cr': '2 Crônicas',
  ed: 'Esdras', ne: 'Neemias', et: 'Ester', jó: 'Jó', sl: 'Salmos',
  pv: 'Provérbios', ec: 'Eclesiastes', ct: 'Cânticos', is: 'Isaías',
  jr: 'Jeremias', lm: 'Lamentações', ez: 'Ezequiel', dn: 'Daniel',
  os: 'Oséias', jl: 'Joel', am: 'Amós', ob: 'Obadias', jn: 'Jonas',
  mq: 'Miquéias', na: 'Naum', hc: 'Habacuque', sf: 'Sofonias',
  ag: 'Ageu', zc: 'Zacarias', ml: 'Malaquias',
  mt: 'Mateus', mc: 'Marcos', lc: 'Lucas', jo: 'João', atos: 'Atos',
  rm: 'Romanos', '1co': '1 Coríntios', '2co': '2 Coríntios',
  gl: 'Gálatas', ef: 'Efésios', fp: 'Filipenses', cl: 'Colossenses',
  '1ts': '1 Tessalonicenses', '2ts': '2 Tessalonicenses',
  '1tm': '1 Timóteo', '2tm': '2 Timóteo', tt: 'Tito', fm: 'Filemom',
  hb: 'Hebreus', tg: 'Tiago', '1pe': '1 Pedro', '2pe': '2 Pedro',
  '1jo': '1 João', '2jo': '2 João', '3jo': '3 João', jd: 'Judas', ap: 'Apocalipse',
};

// Tipagem dos dados NVI
const bibleBooks: BibleBook[] = (nviData as Array<{ abbrev: string; chapters: string[][] }>).map(book => ({
  abbrev: book.abbrev,
  name: bookNames[book.abbrev] || book.abbrev,
  chapters: book.chapters,
}));

/**
 * Retorna a lista de livros da Bíblia para uso em dropdowns
 */
export function getBooks(): { abbrev: string; name: string }[] {
  return bibleBooks.map(b => ({ abbrev: b.abbrev, name: b.name }));
}

/**
 * Retorna o número de capítulos de um livro
 */
export function getChapterCount(bookAbbrev: string): number {
  const book = bibleBooks.find(b => b.abbrev === bookAbbrev);
  return book ? book.chapters.length : 0;
}

/**
 * Retorna o número de versículos de um capítulo específico
 */
export function getVerseCount(bookAbbrev: string, chapter: number): number {
  const book = bibleBooks.find(b => b.abbrev === bookAbbrev);
  if (!book || chapter < 1 || chapter > book.chapters.length) return 0;
  return book.chapters[chapter - 1].length;
}

/**
 * Retorna o texto de um versículo específico na versão NVI
 */
export function getVerseText(bookAbbrev: string, chapter: number, verse: number): string | null {
  const book = bibleBooks.find(b => b.abbrev === bookAbbrev);
  if (!book) return null;
  if (chapter < 1 || chapter > book.chapters.length) return null;
  const chapterVerses = book.chapters[chapter - 1];
  if (verse < 1 || verse > chapterVerses.length) return null;
  return chapterVerses[verse - 1];
}

/**
 * Retorna o nome completo de um livro a partir da abreviação
 */
export function getBookName(abbrev: string): string {
  return bookNames[abbrev] || abbrev;
}

/**
 * Formata a referência completa: "Livro capítulo:versículo"
 */
export function formatReference(bookAbbrev: string, chapter: number, verse: number): string {
  const name = getBookName(bookAbbrev);
  return `${name} ${chapter}:${verse}`;
}

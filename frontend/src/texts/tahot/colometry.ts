import type { OTBook } from "@/bible/books";
import type { Verse, Word } from "./tahot.types";

/**
 * Prose/poetry layout for the TAHOT Hebrew OT, derived from the Masoretic data
 * alone ("Option 1"). The dataset has no genre flag and no line-break field, so:
 *
 *  - **Prose** paragraphing comes from the petuhah (פ) / setumah (ס) markers
 *    that arrive as trailing *punctuation* segments on a verse's last word.
 *  - **Poetry** colometry is grounded in the Masoretic cantillation accents,
 *    which are preserved (NFC, never stripped) in each word's `hebrew`. We split
 *    a poetry verse into cola at the major disjunctive accents.
 *
 * Genre is *not* encoded by the accents, so we only render stichographically
 * where the source supports it: the EMeT/poetic books (Psalms, Proverbs, and
 * Job's poetic core) plus the small set of Masoretic "canonical songs".
 * Prophetic oracles, Song of Songs and Lamentations therefore render as prose
 * in this pass. per-passage poetry-tagging layer must be editorially added for
 * further differentiation, it isn't native to the text.
 */

// --- Cantillation accents (combining marks within `word.hebrew`) -------------

// Primary colon dividers. In the EMeT/poetic system ole-weyored (signalled by
// the ole mark) outranks atnach; both mark a major break. Verified on Psa 1:1,
// which splits into a tricolon: ole-weyored → atnach → sof-pasuq.
export const OLE = "֫"; // ole (the rising part of ole-weyored)
export const ATNACH = "֑"; // etnahta
export const SOF_PASUQ = "׃"; // end-of-verse (also arrives as the ׃ punctuation)

// Secondary disjunctives of the prose accent system. Not used by the splitter
// yet — kept named for the documented Option 3 extension (descending into finer
// cola for prophetic poetry once a poetry-passage tagging layer exists).
export const ZAQEF = "֔";
export const SEGOLTA = "֒";
export const REBIA = "֗";
export const TIFCHA = "֖";

// Masoretic paragraph markers, carried as lone punctuation segments.
const PETUHAH = "פ"; // פ — open paragraph
const SETUMAH = "ס"; // ס — closed paragraph

// --- Genre classification ----------------------------------------------------

// Books pointed with the EMeT / poetic accent system. Job is listed but handled
// specially because only its poetic core (3:1–42:6) is poetry.
export const EMET_BOOKS: ReadonlySet<OTBook> = new Set(["Psalms", "Proverbs", "Job"]);

interface SongRange {
  book: OTBook;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

// The standard Masoretic "songs" with special manuscript layout. These mostly
// use the prose accent system, so their cola fall out of atnach + sof-pasuq.
export const CANONICAL_SONG_RANGES: readonly SongRange[] = [
  { book: "Exodus", chapter: 15, startVerse: 1, endVerse: 19 }, // Song of the Sea
  { book: "Deuteronomy", chapter: 32, startVerse: 1, endVerse: 43 }, // Song of Moses
  { book: "Judges", chapter: 5, startVerse: 1, endVerse: 31 }, // Song of Deborah
  { book: "2 Samuel", chapter: 22, startVerse: 1, endVerse: 51 }, // David's song
];

function isCanonicalSong(book: OTBook, chapter: number, verse: number): boolean {
  return CANONICAL_SONG_RANGES.some(
    (r) => r.book === book && r.chapter === chapter && verse >= r.startVerse && verse <= r.endVerse,
  );
}

// Job's prose frame is 1:1–2:13 and 42:7–17; everything between is poetry.
function inJobPoeticCore(chapter: number, verse: number): boolean {
  if (chapter < 3) return false;
  if (chapter === 42 && verse >= 7) return false;
  return true;
}

export function classifyVerse(book: OTBook, chapter: number, verse: number): "poetry" | "prose" {
  if (isCanonicalSong(book, chapter, verse)) return "poetry";
  if (book === "Job") return inJobPoeticCore(chapter, verse) ? "poetry" : "prose";
  if (EMET_BOOKS.has(book)) return "poetry";
  return "prose";
}

// --- Accent / marker probes --------------------------------------------------

function hasAccent(word: Word, mark: string): boolean {
  // The accents are single BMP combining marks, so a substring test on the
  // pointed Hebrew is sufficient; the "/" and "\" separators don't interfere.
  return word.hebrew.includes(mark);
}

function isColonEnd(word: Word): boolean {
  // NB: the paseq ׀ (U+05C0) is *not* a colon boundary — in Psa 1:1 it sits
  // mid-colon — so we key strictly on the disjunctive accents, never on it.
  return hasAccent(word, OLE) || hasAccent(word, ATNACH) || hasAccent(word, SOF_PASUQ);
}

/**
 * True when this verse's last word carries a petuhah/setumah paragraph marker
 * (a lone punctuation segment), i.e. a Masoretic paragraph boundary closes here.
 */
function endsParagraph(verse: Verse): boolean {
  return verse.words.some((w) =>
    w.segments.some(
      (s) => s.kind === "punctuation" && (s.hebrew === PETUHAH || s.hebrew === SETUMAH),
    ),
  );
}

// --- Cola splitting ----------------------------------------------------------

/**
 * Split a poetry verse's words into cola (stichs), breaking after any word that
 * bears a major disjunctive accent (ole-weyored or atnach) and closing the final
 * colon at sof-pasuq. Verses with no internal divider come back as a single colon.
 */
export function splitCola(words: Word[]): Word[][] {
  const cola: Word[][] = [];
  let current: Word[] = [];
  for (const word of words) {
    current.push(word);
    if (isColonEnd(word)) {
      cola.push(current);
      current = [];
    }
  }
  if (current.length > 0) cola.push(current);
  return cola;
}

// --- Passage layout ----------------------------------------------------------

export interface PoetryLine {
  verse: Verse;
  cola: Word[][];
}

export type RenderBlock =
  | { kind: "prose"; id: string; verses: Verse[] }
  | { kind: "poetry"; id: string; lines: PoetryLine[] };

function verseBook(verse: Verse): OTBook | undefined {
  return verse.words[0]?.book;
}

/**
 * Lay a passage out into a flat list of render blocks. Consecutive prose verses
 * collect into a paragraph, broken at petuhah/setumah; consecutive poetry verses
 * collect into one poem, with a fresh block (visual gap) started after a
 * petuhah/setumah so stanzas separate.
 */
export function layoutPassage(verses: Verse[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  let prose: Verse[] | null = null;
  let poetry: PoetryLine[] | null = null;

  const flushProse = () => {
    if (prose && prose.length > 0) {
      const first = prose[0];
      blocks.push({ kind: "prose", id: `p-${first.chapter}-${first.verse}`, verses: prose });
    }
    prose = null;
  };
  const flushPoetry = () => {
    if (poetry && poetry.length > 0) {
      const first = poetry[0].verse;
      blocks.push({ kind: "poetry", id: `v-${first.chapter}-${first.verse}`, lines: poetry });
    }
    poetry = null;
  };

  for (const verse of verses) {
    const book = verseBook(verse);
    const genre = book ? classifyVerse(book, verse.chapter, verse.verse) : "prose";

    if (genre === "poetry") {
      flushProse();
      if (poetry === null) poetry = [];
      poetry.push({ verse, cola: splitCola(verse.words) });
      if (endsParagraph(verse)) flushPoetry();
    } else {
      flushPoetry();
      if (prose === null) prose = [];
      prose.push(verse);
      if (endsParagraph(verse)) flushProse();
    }
  }
  flushProse();
  flushPoetry();
  return blocks;
}

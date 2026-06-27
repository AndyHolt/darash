import type { OTBook } from "@/bible/books";
import type { Reference } from "@/bible/references";

export type SegmentKind = "prefix" | "root" | "suffix" | "punctuation";

export type Language = "Hebrew" | "Aramaic";

export type PartOfSpeech =
  | "adjective"
  | "conjunction"
  | "sequential conjunction"
  | "adverb"
  | "noun"
  | "pronoun"
  | "preposition"
  | "suffix"
  | "particle"
  | "verb";

// Decoded verb-stem labels. The underlying codes are language-dependent, but
// the labels are flat; a few (hophal, pual, hithpael) occur in both languages.
export type VerbStem =
  // Hebrew
  | "qal"
  | "niphal"
  | "qal passive"
  | "piel"
  | "pual"
  | "polal"
  | "nithpael"
  | "hothpaal"
  | "hithpael"
  | "hiphil"
  | "tiphil"
  | "hophal"
  | "hishtaphel"
  // Aramaic
  | "peal"
  | "peil"
  | "pael"
  | "hithpaal"
  | "itpeel"
  | "haphel"
  | "aphel"
  | "shaphel"
  | "ishtaphel";

export type VerbType =
  | "perfect"
  | "consecutive perfect"
  | "imperfect"
  | "consecutive imperfect"
  | "conjunctive imperfect"
  | "jussive"
  | "cohortative"
  | "imperative"
  | "infinitive absolute"
  | "infinitive construct"
  | "active participle"
  | "passive participle";

export type Person = "first" | "second" | "third";

export type Gender = "masculine" | "feminine" | "common" | "both";

// `GrammaticalNumber` rather than `Number` to avoid shadowing the JS builtin
// (matching the morphgnt idiom).
export type GrammaticalNumber = "singular" | "plural" | "dual";

export type State = "absolute" | "construct" | "determined";

export type FunctionMarker = "object" | "indirect object" | "related";

// POS-specific sub-classification label. A single field because the same source
// letter means different things under different parts of speech; this union is
// the closed set of labels the ingest emits across every part of speech.
export type Subtype =
  // noun
  | "common"
  | "gentilic"
  | "numerical"
  | "title"
  // proper noun
  | "proper name (person, masculine)"
  | "proper name (person, feminine)"
  | "proper name (location)"
  | "proper name (title)"
  // adjective
  | "adjective"
  | "cardinal number"
  | "ordinal number"
  // pronoun
  | "demonstrative"
  | "interrogative"
  | "personal"
  | "relative"
  // suffix
  | "directional he"
  | "paragogic he"
  | "paragogic nun"
  | "pronominal"
  // particle
  | "affirmation"
  | "conditional"
  | "definite article"
  | "Aramaic article"
  | "interjection"
  | "negative"
  | "object marker"
  | "consequence/affirmation"
  // preposition
  | "with article";

export interface WordSegment {
  segment_index: number;
  kind: SegmentKind;
  hebrew: string;
  transliteration?: string;
  gloss?: string;
  strong?: string;
  // Raw ETCBC/STEP grammar code (e.g. "Ncfsa"); kept verbatim, so a plain string.
  morph_code?: string;
  language?: Language;
  part_of_speech?: PartOfSpeech;
  subtype?: Subtype;
  verb_stem?: VerbStem;
  verb_type?: VerbType;
  person?: Person;
  gender?: Gender;
  number?: GrammaticalNumber;
  state?: State;
  function_marker?: FunctionMarker;
}

export interface Word {
  book: OTBook;
  chapter: number;
  verse: number;
  // String, not number: TAHOT uses "01", "02", and inserts like "0501"
  // ("after word 5"), so it is not safely sortable as an integer.
  word_index: string;
  hebrew_ref?: string;
  text_type: string;
  variant_markers: string;
  has_meaning_variant: boolean;
  // Full pointed Hebrew with cantillation, with "/" separating prefixes/suffixes
  // from the root and "\" separating trailing punctuation.
  hebrew: string;
  transliteration: string;
  translation: string;
  grammar: string;
  meaning_variants: string;
  spelling_variants: string;
  root_strong?: string;
  root_sstrong?: string;
  alt_strongs: string;
  expanded_strongs: string;
  // Frequency of this exact surface form / of the root lemma, across the whole OT.
  form_count: number;
  form_rank: number;
  lemma_count: number;
  lemma_rank: number;
  segments: WordSegment[];
}

export interface Verse {
  chapter: number;
  verse: number;
  words: Word[];
}

export interface Passage {
  reference: Reference;
  verses: Verse[];
}

export function wordKey(w: Word): string {
  return `${w.book}.${w.chapter}.${w.verse}.${w.word_index}`;
}

/**
 * The word as it should appear inline in the reading text: the morphemes joined
 * with their punctuation, with only the "/" and "\" column separators of the raw
 * `hebrew` field removed.
 *
 * The petuhah (פ) / setumah (ס) paragraph markers are part of the Masoretic
 * text and are kept inline, exactly like the vowel pointing and cantillation
 * accents — this renders the text faithfully and does not strip them. The
 * colometry layer reads the same markers independently to drive paragraph /
 * stanza breaks (see `endsParagraph`), so a closed paragraph shows both the
 * marker glyph and the structural break, as in printed editions (e.g. BHS).
 */
export function wordDisplayHebrew(w: Word): string {
  if (w.segments.length > 0) {
    return w.segments.map((s) => s.hebrew).join("");
  }
  // Fallback when segments are unavailable: strip only the column separators.
  return w.hebrew.replace(/[/\\]/g, "").trim();
}

// TAHOT keeps maqqef-joined words as separate entries, the first carrying a
// trailing maqqef, so the reading view must render them flush (no intervening
// space).
const MAQQEF = "־";

// The petuhah (פ) / setumah (ס) Masoretic paragraph markers ride along as a
// word's trailing punctuation segment.
const PARAGRAPH_MARKERS = new Set(["פ", "ס"]);

function isParagraphMarker(s: WordSegment): boolean {
  return s.kind === "punctuation" && PARAGRAPH_MARKERS.has(s.hebrew);
}

/**
 * The word's reading text split from any petuhah/setumah paragraph marker it
 * carries. The marker is part of the text (see `wordDisplayHebrew`), but the
 * reading view sets it apart with spacing the way printed editions do, so it
 * needs the marker separated from the word body. `paragraphMarker` is undefined
 * for the common no-marker case.
 *
 * `joinsNext` is true when the word ends in a maqqef and so binds flush to the
 * next word, which the reading view honours by suppressing the trailing space.
 */
export function wordDisplayParts(w: Word): {
  text: string;
  paragraphMarker?: string;
  joinsNext: boolean;
} {
  const paragraphMarker = w.segments.find(isParagraphMarker)?.hebrew;
  const text = paragraphMarker
    ? w.segments
        .filter((s) => !isParagraphMarker(s))
        .map((s) => s.hebrew)
        .join("")
    : wordDisplayHebrew(w);
  return { text, paragraphMarker, joinsNext: text.endsWith(MAQQEF) };
}

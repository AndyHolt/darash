import type { NTBook } from "@/bible/books";
import type { Reference } from "@/bible/references";

export type PartOfSpeech =
  | "adjective"
  | "conjunction"
  | "adverb"
  | "interjection"
  | "noun"
  | "preposition"
  | "article"
  | "demonstrative pronoun"
  | "interrogative/indefinite pronoun"
  | "personal pronoun"
  | "relative pronoun"
  | "verb"
  | "particle";

export type Person = "first" | "second" | "third";

export type Tense = "present" | "imperfect" | "future" | "aorist" | "perfect" | "pluperfect";

export type Voice = "active" | "middle" | "passive";

export type Mood =
  | "indicative"
  | "imperative"
  | "subjunctive"
  | "optative"
  | "infinitive"
  | "participle";

export type Case = "nominative" | "genitive" | "dative" | "accusative" | "vocative";

export type GrammaticalNumber = "singular" | "plural";

export type Gender = "masculine" | "feminine" | "neuter";

export type Degree = "comparative" | "superlative";

export interface Word {
  book: NTBook;
  chapter: number;
  verse: number;
  word_index: number;
  part_of_speech: PartOfSpeech;
  person?: Person;
  tense?: Tense;
  voice?: Voice;
  mood?: Mood;
  case?: Case;
  number?: GrammaticalNumber;
  gender?: Gender;
  degree?: Degree;
  text: string;
  text_word: string;
  normalized: string;
  lemma: string;
}

export interface Passage {
  reference: Reference;
  words: Word[];
}

export function wordKey(w: Word): string {
  return `${w.book}.${w.chapter}.${w.verse}.${w.word_index}`;
}

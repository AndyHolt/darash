import type { NT_BOOKS, OT_BOOKS } from "./bible";

export type OTBook = (typeof OT_BOOKS)[number]["name"];

export type NTBook = (typeof NT_BOOKS)[number]["name"];

export type Book = OTBook | NTBook;

export interface VerseReference {
  book: Book;
  chapter: number;
  verse: number;
}

export interface TaggedVerseReference extends VerseReference {
  kind: "verse";
}

export interface RangeReference {
  kind: "range";
  start: VerseReference;
  end: VerseReference;
}

export type Reference = TaggedVerseReference | RangeReference;

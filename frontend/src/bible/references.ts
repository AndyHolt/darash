import { BOOKS, type Book } from "./books";

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

export function formatVerseReference(ref: VerseReference): string {
  return `${ref.book} ${ref.chapter}:${ref.verse}`;
}

export function formatRangeReference(ref: RangeReference): string {
  if (ref.start.book !== ref.end.book) {
    return `${formatVerseReference(ref.start)}–${formatVerseReference(ref.end)}`;
  }
  if (ref.start.chapter !== ref.end.chapter) {
    return `${ref.start.book} ${ref.start.chapter}:${ref.start.verse}–${ref.end.chapter}:${ref.end.verse}`;
  }
  return `${ref.start.book} ${ref.start.chapter}:${ref.start.verse}–${ref.end.verse}`;
}

export function formatReference(ref: Reference): string {
  switch (ref.kind) {
    case "verse":
      return formatVerseReference(ref);
    case "range":
      return formatRangeReference(ref);
    default: {
      const exhaustive: never = ref;
      throw new Error("Unexpected reference type:", exhaustive);
    }
  }
}

export function verseUrlTag(ref: VerseReference): string {
  const bookInfo = BOOKS.find((b) => b.name === ref.book);
  if (!bookInfo) {
    throw new Error(`Unknown book: ${ref.book}`);
  }
  const bookAbbrev = bookInfo.abbrev.toLowerCase();
  return `${bookAbbrev}.${ref.chapter}.${ref.verse}`;
}

export function rangeUrlTag(ref: RangeReference): string {
  return `${verseUrlTag(ref.start)}-${verseUrlTag(ref.end)}`;
}

export function referenceUrlTag(ref: Reference): string {
  switch (ref.kind) {
    case "verse":
      return verseUrlTag(ref);
    case "range":
      return rangeUrlTag(ref);
    default: {
      const exhaustive: never = ref;
      throw new Error("Unexpected reference type:", exhaustive);
    }
  }
}

export function parseVerseUrlTag(tag: string): VerseReference {
  const parts = tag.split(".");
  if (parts.length !== 3) {
    throw new Error(`Invalid verse url tag: ${tag}`);
  }
  const [abbrev, chapterStr, verseStr] = parts;
  const bookInfo = BOOKS.find((b) => b.abbrev.toLowerCase() === abbrev.toLowerCase());
  if (!bookInfo) {
    throw new Error(`Unknown book abbreviation: ${abbrev}`);
  }
  const chapter = Number.parseInt(chapterStr, 10);
  const verse = Number.parseInt(verseStr, 10);
  if (Number.isNaN(chapter) || Number.isNaN(verse)) {
    throw new Error(`Invalid chapter or verse in url tag: ${tag}`);
  }
  return { book: bookInfo.name, chapter, verse };
}

export function parseRangeUrlTag(tag: string): RangeReference {
  const parts = tag.split("-");
  if (parts.length !== 2) {
    throw new Error(`Invalid range url tag: ${tag}`);
  }
  return {
    kind: "range",
    start: parseVerseUrlTag(parts[0]),
    end: parseVerseUrlTag(parts[1]),
  };
}

export function parseReferenceUrlTag(tag: string): Reference {
  if (tag.includes("-")) {
    return parseRangeUrlTag(tag);
  }
  return { kind: "verse", ...parseVerseUrlTag(tag) };
}

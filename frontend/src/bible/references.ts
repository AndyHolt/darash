import type { Book } from "./books";

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

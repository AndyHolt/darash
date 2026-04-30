import { type Book, lookupBookByAbbrev, lookupBookByName } from "./books";

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

/**
 * Build a {@link Reference} from a start/end verse pair, collapsing to a
 * {@link TaggedVerseReference} when the two endpoints are the same verse.
 *
 * The collapse keeps URLs and display strings canonical: a passage with
 * matching start and end is just a verse, not a degenerate range like
 * `john.3.16-john.3.16`.
 *
 * Scope is deliberately structural: the function does not validate that
 * `start` precedes `end` in canon order. A "backwards" pair (e.g. start
 * John 3:16, end John 3:10) is returned verbatim as a range. This is by
 * design — the picker UI enforces ordering at input time via disabled
 * controls, so the structural builder stays free of policy. Callers that
 * accept untrusted endpoints (parsing user input, URL params edited by
 * hand, etc.) are responsible for their own ordering check before
 * calling this function.
 */
export function passageReference(start: VerseReference, end: VerseReference): Reference {
  if (start.book === end.book && start.chapter === end.chapter && start.verse === end.verse) {
    return { kind: "verse", ...start };
  }
  return { kind: "range", start, end };
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
  const bookInfo = lookupBookByName(ref.book);
  return `${bookInfo.abbrev.toLowerCase()}.${ref.chapter}.${ref.verse}`;
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
  const bookInfo = lookupBookByAbbrev(abbrev);
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

import { describe, expect, test } from "vitest";
import type { RangeReference, TaggedVerseReference, VerseReference } from "./bible.types";
import { formatRangeReference, formatReference, formatVerseReference } from "./references";

describe("formatVerseReference", () => {
  test("single-word book name", () => {
    const ref: VerseReference = { book: "Matthew", chapter: 3, verse: 16 };
    expect(formatVerseReference(ref)).toBe("Matthew 3:16");
  });

  test("multi-word book name", () => {
    const ref: VerseReference = { book: "1 Corinthians", chapter: 13, verse: 4 };
    expect(formatVerseReference(ref)).toBe("1 Corinthians 13:4");
  });
});

describe("formatRangeReference", () => {
  test("same chapter", () => {
    const ref: RangeReference = {
      kind: "range",
      start: { book: "Matthew", chapter: 3, verse: 16 },
      end: { book: "Matthew", chapter: 3, verse: 25 },
    };
    expect(formatRangeReference(ref)).toBe("Matthew 3:16–25");
  });

  test("different chapters, same book", () => {
    const ref: RangeReference = {
      kind: "range",
      start: { book: "Matthew", chapter: 3, verse: 16 },
      end: { book: "Matthew", chapter: 4, verse: 25 },
    };
    expect(formatRangeReference(ref)).toBe("Matthew 3:16–4:25");
  });

  test("different books", () => {
    const ref: RangeReference = {
      kind: "range",
      start: { book: "Matthew", chapter: 28, verse: 20 },
      end: { book: "Mark", chapter: 1, verse: 1 },
    };
    expect(formatRangeReference(ref)).toBe("Matthew 28:20–Mark 1:1");
  });
});

describe("formatReference", () => {
  test("verse reference", () => {
    const ref: TaggedVerseReference = {
      kind: "verse",
      book: "John",
      chapter: 1,
      verse: 1,
    };
    expect(formatReference(ref)).toBe("John 1:1");
  });

  test("range reference", () => {
    const ref: RangeReference = {
      kind: "range",
      start: { book: "Romans", chapter: 8, verse: 1 },
      end: { book: "Romans", chapter: 8, verse: 39 },
    };
    expect(formatReference(ref)).toBe("Romans 8:1–39");
  });
});

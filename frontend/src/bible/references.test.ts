import { describe, expect, test } from "vitest";
import type { Book } from "./books";
import {
  formatRangeReference,
  formatReference,
  formatVerseReference,
  parseReferenceUrlTag,
  type RangeReference,
  type Reference,
  rangeUrlTag,
  referenceUrlTag,
  type TaggedVerseReference,
  type VerseReference,
  verseUrlTag,
} from "./references";

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

describe("verseUrlTag", () => {
  test("uses lowercase abbreviation", () => {
    expect(verseUrlTag({ book: "John", chapter: 3, verse: 16 })).toBe("john.3.16");
  });

  test("multi-word book uses its abbreviation, not its name", () => {
    expect(verseUrlTag({ book: "1 Corinthians", chapter: 13, verse: 4 })).toBe("1cor.13.4");
  });

  test("OT book", () => {
    expect(verseUrlTag({ book: "Genesis", chapter: 1, verse: 1 })).toBe("gen.1.1");
  });

  test("single-chapter book", () => {
    expect(verseUrlTag({ book: "3 John", chapter: 1, verse: 14 })).toBe("3john.1.14");
  });

  test("throws on unknown book", () => {
    expect(() => verseUrlTag({ book: "Atlantis" as Book, chapter: 1, verse: 1 })).toThrow(
      /unknown book/i,
    );
  });
});

describe("rangeUrlTag", () => {
  test("joins verse tags with a hyphen", () => {
    expect(
      rangeUrlTag({
        kind: "range",
        start: { book: "Romans", chapter: 8, verse: 1 },
        end: { book: "Romans", chapter: 8, verse: 39 },
      }),
    ).toBe("rom.8.1-rom.8.39");
  });

  test("range across chapters", () => {
    expect(
      rangeUrlTag({
        kind: "range",
        start: { book: "Matthew", chapter: 3, verse: 16 },
        end: { book: "Matthew", chapter: 4, verse: 25 },
      }),
    ).toBe("matt.3.16-matt.4.25");
  });

  test("range across books", () => {
    expect(
      rangeUrlTag({
        kind: "range",
        start: { book: "Matthew", chapter: 28, verse: 20 },
        end: { book: "Mark", chapter: 1, verse: 1 },
      }),
    ).toBe("matt.28.20-mark.1.1");
  });

  test("propagates unknown-book errors from start", () => {
    expect(() =>
      rangeUrlTag({
        kind: "range",
        start: { book: "Atlantis" as Book, chapter: 1, verse: 1 },
        end: { book: "John", chapter: 1, verse: 1 },
      }),
    ).toThrow(/unknown book/i);
  });

  test("propagates unknown-book errors from end", () => {
    expect(() =>
      rangeUrlTag({
        kind: "range",
        start: { book: "John", chapter: 1, verse: 1 },
        end: { book: "Atlantis" as Book, chapter: 1, verse: 1 },
      }),
    ).toThrow(/unknown book/i);
  });
});

describe("referenceUrlTag", () => {
  test("dispatches verse references to verseUrlTag", () => {
    expect(referenceUrlTag({ kind: "verse", book: "John", chapter: 3, verse: 16 })).toBe(
      "john.3.16",
    );
  });

  test("dispatches range references to rangeUrlTag", () => {
    expect(
      referenceUrlTag({
        kind: "range",
        start: { book: "Matthew", chapter: 28, verse: 20 },
        end: { book: "Mark", chapter: 1, verse: 1 },
      }),
    ).toBe("matt.28.20-mark.1.1");
  });
});

describe("referenceUrlTag round-trip", () => {
  const cases: { name: string; ref: Reference; tag: string }[] = [
    {
      name: "single-word book verse",
      ref: { kind: "verse", book: "John", chapter: 3, verse: 16 },
      tag: "john.3.16",
    },
    {
      name: "multi-word book verse",
      ref: { kind: "verse", book: "1 Corinthians", chapter: 13, verse: 4 },
      tag: "1cor.13.4",
    },
    {
      name: "OT book verse",
      ref: { kind: "verse", book: "Genesis", chapter: 1, verse: 1 },
      tag: "gen.1.1",
    },
    {
      name: "single-chapter book",
      ref: { kind: "verse", book: "3 John", chapter: 1, verse: 14 },
      tag: "3john.1.14",
    },
    {
      name: "range within a chapter",
      ref: {
        kind: "range",
        start: { book: "Romans", chapter: 8, verse: 1 },
        end: { book: "Romans", chapter: 8, verse: 39 },
      },
      tag: "rom.8.1-rom.8.39",
    },
    {
      name: "range across chapters",
      ref: {
        kind: "range",
        start: { book: "Matthew", chapter: 3, verse: 16 },
        end: { book: "Matthew", chapter: 4, verse: 25 },
      },
      tag: "matt.3.16-matt.4.25",
    },
    {
      name: "range across books",
      ref: {
        kind: "range",
        start: { book: "Matthew", chapter: 28, verse: 20 },
        end: { book: "Mark", chapter: 1, verse: 1 },
      },
      tag: "matt.28.20-mark.1.1",
    },
  ];

  for (const { name, ref, tag } of cases) {
    test(`ref → tag → ref preserves ${name}`, () => {
      expect(parseReferenceUrlTag(referenceUrlTag(ref))).toEqual(ref);
    });

    test(`tag → ref → tag preserves ${name}`, () => {
      expect(referenceUrlTag(parseReferenceUrlTag(tag))).toBe(tag);
    });
  }
});

describe("parseReferenceUrlTag", () => {
  test("accepts uppercase abbreviation", () => {
    expect(parseReferenceUrlTag("JOHN.3.16")).toEqual({
      kind: "verse",
      book: "John",
      chapter: 3,
      verse: 16,
    });
  });

  test("throws on unknown book abbreviation", () => {
    expect(() => parseReferenceUrlTag("xyz.1.1")).toThrow(/unknown book/i);
  });

  test("throws on malformed verse tag", () => {
    expect(() => parseReferenceUrlTag("john.3")).toThrow(/invalid verse url tag/i);
  });

  test("throws on non-numeric chapter or verse", () => {
    expect(() => parseReferenceUrlTag("john.three.16")).toThrow(/invalid chapter or verse/i);
  });
});

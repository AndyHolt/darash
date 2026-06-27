import { describe, expect, test } from "vitest";
import { type Word, type WordSegment, wordDisplayParts } from "./tahot.types";

function seg(hebrew: string, overrides: Partial<WordSegment> = {}): WordSegment {
  return { segment_index: 0, kind: "root", hebrew, ...overrides };
}

function word(segments: WordSegment[]): Word {
  // The display helpers only read `segments` / `hebrew`; the rest of the Word
  // shape is irrelevant here, so build a minimal fixture.
  return { segments, hebrew: segments.map((s) => s.hebrew).join("") } as Word;
}

describe("wordDisplayParts", () => {
  test("a plain word does not join the next", () => {
    const parts = wordDisplayParts(word([seg("בְּרֵאשִׁית")]));
    expect(parts).toEqual({ text: "בְּרֵאשִׁית", paragraphMarker: undefined, joinsNext: false });
  });

  test("a trailing maqqef marks the word as joining the next", () => {
    const parts = wordDisplayParts(
      word([seg("עַל", { kind: "prefix" }), seg("־", { kind: "punctuation" })]),
    );
    expect(parts.text).toBe("עַל־");
    expect(parts.joinsNext).toBe(true);
  });

  test("a trailing paseq is split out as a separate divider", () => {
    const parts = wordDisplayParts(word([seg("עִבְר֣וּ"), seg("׀", { kind: "punctuation" })]));
    expect(parts.text).toBe("עִבְר֣וּ");
    expect(parts.paseq).toBe("׀");
    expect(parts.joinsNext).toBe(false);
  });

  test("a paragraph marker is split out and does not count as joining", () => {
    const parts = wordDisplayParts(
      word([seg("הָאָֽרֶץ"), seg("׃", { kind: "punctuation" }), seg("פ", { kind: "punctuation" })]),
    );
    expect(parts.text).toBe("הָאָֽרֶץ׃");
    expect(parts.paragraphMarker).toBe("פ");
    expect(parts.joinsNext).toBe(false);
  });
});

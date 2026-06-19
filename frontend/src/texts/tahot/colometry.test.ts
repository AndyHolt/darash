import { describe, expect, test } from "vitest";
import { classifyVerse, layoutPassage, splitCola } from "./colometry";
import type { TahotSegment, TahotVerse, TahotWord } from "./tahot.types";

// Accent codepoints, by their Unicode escapes, so the fixtures are unambiguous
// and the test doubles as a check that the colometry constants match them.
const OLE = "֫"; // ole (ole-weyored)
const ATNACH = "֑"; // etnahta
const SOF_PASUQ = "׃"; // sof-pasuq

function word(
  book: TahotWord["book"],
  chapter: number,
  verse: number,
  index: string,
  hebrew: string,
  segments: TahotSegment[] = [],
): TahotWord {
  return {
    book,
    chapter,
    verse,
    word_index: index,
    text_type: "L",
    variant_markers: "",
    has_meaning_variant: false,
    hebrew,
    transliteration: "",
    translation: "",
    grammar: "",
    meaning_variants: "",
    spelling_variants: "",
    alt_strongs: "",
    expanded_strongs: "",
    form_count: 0,
    form_rank: 0,
    lemma_count: 0,
    lemma_rank: 0,
    segments,
  };
}

const punct = (hebrew: string): TahotSegment => ({
  segment_index: 99,
  kind: "punctuation",
  hebrew,
});

describe("splitCola", () => {
  test("Psalm 1:1 splits into a tricolon (ole-weyored → atnach → sof-pasuq)", () => {
    // Only the three divider-bearing words need real accents; the rest are bare.
    const ps11 = [
      word("Psalms", 1, 1, "01", "אשרי"),
      word("Psalms", 1, 1, "02", "האיש"),
      word("Psalms", 1, 1, "03", "אשר"),
      word("Psalms", 1, 1, "04", "לא"),
      word("Psalms", 1, 1, "05", "הלך"),
      word("Psalms", 1, 1, "06", "בעצת"),
      word("Psalms", 1, 1, "07", `רשע${OLE}ים`), // ole-weyored → end colon 1
      word("Psalms", 1, 1, "08", "ובדרך"),
      word("Psalms", 1, 1, "09", "חטאים"),
      word("Psalms", 1, 1, "10", "לא"),
      word("Psalms", 1, 1, "11", `עמ${ATNACH}ד`), // atnach → end colon 2
      word("Psalms", 1, 1, "12", "ובמושב"),
      word("Psalms", 1, 1, "13", "לצים"),
      word("Psalms", 1, 1, "14", "לא"),
      word("Psalms", 1, 1, "15", `ישב\\${SOF_PASUQ}`), // sof-pasuq → end colon 3
    ];
    const cola = splitCola(ps11);
    expect(cola.map((c) => c.length)).toEqual([7, 4, 4]);
  });

  test("a verse with no internal divider is a single colon", () => {
    const words = [
      word("Psalms", 2, 1, "01", "למה"),
      word("Psalms", 2, 1, "02", `גוים\\${SOF_PASUQ}`),
    ];
    expect(splitCola(words)).toHaveLength(1);
  });
});

describe("classifyVerse", () => {
  test("EMeT books are poetry", () => {
    expect(classifyVerse("Psalms", 1, 1)).toBe("poetry");
    expect(classifyVerse("Proverbs", 1, 1)).toBe("poetry");
  });

  test("Job's prose frame vs poetic core", () => {
    expect(classifyVerse("Job", 1, 1)).toBe("prose"); // prologue
    expect(classifyVerse("Job", 2, 13)).toBe("prose");
    expect(classifyVerse("Job", 3, 1)).toBe("poetry"); // poem begins
    expect(classifyVerse("Job", 42, 6)).toBe("poetry"); // last poetic verse
    expect(classifyVerse("Job", 42, 7)).toBe("prose"); // epilogue
  });

  test("prophets, Song and Lamentations render as prose in this pass", () => {
    expect(classifyVerse("Isaiah", 1, 1)).toBe("prose");
    expect(classifyVerse("Song of Songs", 1, 1)).toBe("prose");
    expect(classifyVerse("Lamentations", 1, 1)).toBe("prose");
  });

  test("canonical songs are poetry within their range", () => {
    expect(classifyVerse("Exodus", 15, 1)).toBe("poetry");
    expect(classifyVerse("Exodus", 15, 19)).toBe("poetry");
    expect(classifyVerse("Exodus", 15, 20)).toBe("prose"); // just past the song
    expect(classifyVerse("Exodus", 14, 31)).toBe("prose"); // before the song
  });
});

describe("layoutPassage", () => {
  function verse(
    book: TahotWord["book"],
    chapter: number,
    v: number,
    endMarker?: "פ" | "ס",
  ): TahotVerse {
    const last = word(book, chapter, v, "02", "סוף", endMarker ? [punct(endMarker)] : []);
    return { chapter, verse: v, words: [word(book, chapter, v, "01", "מילה"), last] };
  }

  test("prose verses group into a paragraph, broken at petuhah/setumah", () => {
    const blocks = layoutPassage([
      verse("Genesis", 1, 1),
      verse("Genesis", 1, 2, "פ"), // close paragraph here
      verse("Genesis", 1, 3),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["prose", "prose"]);
    expect(blocks[0].kind === "prose" && blocks[0].verses.length).toBe(2);
    expect(blocks[1].kind === "prose" && blocks[1].verses.length).toBe(1);
  });

  test("poetry and prose runs produce distinct blocks", () => {
    const blocks = layoutPassage([
      verse("Job", 2, 13), // prose frame
      verse("Job", 3, 1), // poetry core
      verse("Job", 3, 2),
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(["prose", "poetry"]);
    expect(blocks[1].kind === "poetry" && blocks[1].lines.length).toBe(2);
  });
});

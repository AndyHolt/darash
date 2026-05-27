import { describe, expect, test } from "vitest";
import type { Lexicon, Word } from "@/texts/morphgnt";
import { formatGloss, glossesOf } from "./gloss";

function lex(gloss: string, overrides: Partial<Lexicon> = {}): Lexicon {
  return { form: "", transliteration: "", gloss, meaning: "", ...overrides };
}

function word(lexicon: Lexicon[]): Word {
  return {
    book: "John",
    chapter: 1,
    verse: 1,
    word_index: 0,
    part_of_speech: "noun",
    text: "",
    text_word: "",
    normalized: "",
    lemma: "",
    normalized_count: 0,
    normalized_rank: 0,
    lemma_count: 0,
    lemma_rank: 0,
    paragraph_id: 0,
    lexicon,
  };
}

describe("glossesOf", () => {
  test("empty lexicon → empty array", () => {
    expect(glossesOf(word([]))).toEqual([]);
  });

  test("single entry → single-element array", () => {
    expect(glossesOf(word([lex("word")]))).toEqual(["word"]);
  });

  test("distinct glosses preserved in source order", () => {
    expect(glossesOf(word([lex("Jesus"), lex("Joshua")]))).toEqual(["Jesus", "Joshua"]);
  });

  test("duplicates are collapsed", () => {
    expect(glossesOf(word([lex("Jacob"), lex("Jacob")]))).toEqual(["Jacob"]);
  });

  test("dedup preserves first occurrence ordering", () => {
    expect(glossesOf(word([lex("a"), lex("b"), lex("a"), lex("c")]))).toEqual(["a", "b", "c"]);
  });
});

describe("formatGloss", () => {
  test("empty lexicon → empty string", () => {
    expect(formatGloss(word([]))).toBe("");
  });

  test("single gloss → bare gloss", () => {
    expect(formatGloss(word([lex("word")]))).toBe("word");
  });

  test("multiple distinct glosses joined with ' / '", () => {
    expect(formatGloss(word([lex("Jesus"), lex("Joshua")]))).toBe("Jesus / Joshua");
  });

  test("duplicates collapsed before joining", () => {
    expect(formatGloss(word([lex("Jacob"), lex("Jacob")]))).toBe("Jacob");
  });
});

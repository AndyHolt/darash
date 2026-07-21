import { describe, expect, test } from "vitest";
import { meaningsOf } from "./meaning";
import type { Lexicon, Word } from "./morphgnt.types";

function lex(gloss: string, meaning: string): Lexicon {
  return { form: "", transliteration: "", gloss, meaning };
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

describe("meaningsOf", () => {
  test("meaning is kept verbatim", () => {
    const markup = "<b>teacher</b>, one who instructs";
    expect(meaningsOf(word([lex("teacher", markup)]))).toEqual([markup]);
  });

  test("meaning that merely restates the gloss is still kept", () => {
    expect(meaningsOf(word([lex("teacher", "teacher")]))).toEqual(["teacher"]);
  });

  test("duplicate meanings are collapsed", () => {
    const markup = "<b>a</b> fuller sense";
    expect(meaningsOf(word([lex("a", markup), lex("a", markup)]))).toEqual([markup]);
  });
});

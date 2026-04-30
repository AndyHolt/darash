import { describe, expect, test } from "vitest";
import type { Word } from "@/texts/morphgnt";
import { formatParsing } from "./parsing";

function word(overrides: Partial<Word>): Word {
  return {
    book: "John",
    chapter: 1,
    verse: 1,
    word_index: 0,
    part_of_speech: "noun",
    text: "",
    text_word: "",
    normalized: "",
    lemma: "λόγος",
    ...overrides,
  };
}

describe("formatParsing — adjectives", () => {
  test("case/gender/number", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "adjective",
          case: "nominative",
          gender: "masculine",
          number: "singular",
          lemma: "ἀγαθός",
        }),
      ),
    ).toBe("Adjective: NMS");
  });

  test("with comparative degree", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "adjective",
          case: "genitive",
          gender: "feminine",
          number: "plural",
          degree: "comparative",
          lemma: "μέγας",
        }),
      ),
    ).toBe("Adjective: GFP Comp");
  });
});

describe("formatParsing — verbs", () => {
  test("finite verb", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "verb",
          tense: "aorist",
          voice: "active",
          mood: "indicative",
          person: "third",
          number: "singular",
          lemma: "λύω",
        }),
      ),
    ).toBe("Finite verb: Aor Act Ind 3S");
  });

  test("present passive imperative 2P", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "verb",
          tense: "present",
          voice: "passive",
          mood: "imperative",
          person: "second",
          number: "plural",
          lemma: "λύω",
        }),
      ),
    ).toBe("Finite verb: Pres Pass Impv 2P");
  });

  test("participle", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "verb",
          tense: "aorist",
          voice: "active",
          mood: "participle",
          case: "nominative",
          gender: "masculine",
          number: "singular",
          lemma: "λύω",
        }),
      ),
    ).toBe("Participle: Aor Act Ptc NMS");
  });

  test("infinitive", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "verb",
          tense: "aorist",
          voice: "active",
          mood: "infinitive",
          lemma: "λύω",
        }),
      ),
    ).toBe("Infinitive: Aor Act Inf");
  });
});

describe("formatParsing — other parts of speech", () => {
  test("noun shows case/gender/number", () => {
    expect(
      formatParsing(
        word({
          part_of_speech: "noun",
          case: "dative",
          gender: "neuter",
          number: "plural",
          lemma: "τέκνον",
        }),
      ),
    ).toBe("Noun: DNP");
  });

  test("indeclinable shows label only", () => {
    expect(formatParsing(word({ part_of_speech: "conjunction", lemma: "καί" }))).toBe(
      "Conjunction",
    );
  });
});

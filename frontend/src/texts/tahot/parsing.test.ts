import { describe, expect, test } from "vitest";
import { formatSegmentParsing } from "./parsing";
import type { WordSegment } from "./tahot.types";

function seg(overrides: Partial<WordSegment>): WordSegment {
  return { segment_index: 0, kind: "root", hebrew: "", ...overrides };
}

describe("formatSegmentParsing", () => {
  test("returns empty for punctuation", () => {
    expect(formatSegmentParsing(seg({ kind: "punctuation" }))).toBe("");
  });

  test("returns empty when there is no part of speech", () => {
    expect(formatSegmentParsing(seg({}))).toBe("");
  });

  describe("verbs", () => {
    test("stem, type and person-gender-number", () => {
      expect(
        formatSegmentParsing(
          seg({
            part_of_speech: "verb",
            verb_stem: "qal",
            verb_type: "perfect",
            person: "third",
            gender: "masculine",
            number: "singular",
          }),
        ),
      ).toBe("Qal perfect 3ms");
    });

    test("type without a person-gender-number code", () => {
      expect(
        formatSegmentParsing(
          seg({ part_of_speech: "verb", verb_stem: "niphal", verb_type: "infinitive construct" }),
        ),
      ).toBe("Niphal infinitive construct");
    });

    test("falls back to 'Verb' when the stem is missing", () => {
      expect(formatSegmentParsing(seg({ part_of_speech: "verb" }))).toBe("Verb");
    });

    test("imperative carries second person, masculine plural", () => {
      expect(
        formatSegmentParsing(
          seg({
            part_of_speech: "verb",
            verb_stem: "hiphil",
            verb_type: "imperative",
            person: "second",
            gender: "masculine",
            number: "plural",
          }),
        ),
      ).toBe("Hiphil imperative 2mp");
    });

    test("'both' gender abbreviates to 'b'", () => {
      expect(
        formatSegmentParsing(
          seg({
            part_of_speech: "verb",
            verb_stem: "qal",
            verb_type: "imperative",
            person: "second",
            gender: "both",
            number: "plural",
          }),
        ),
      ).toBe("Qal imperative 2bp");
    });
  });

  describe("nominals (gender-number-state)", () => {
    test("noun in construct, feminine singular", () => {
      expect(
        formatSegmentParsing(
          seg({
            part_of_speech: "noun",
            gender: "feminine",
            number: "singular",
            state: "construct",
          }),
        ),
      ).toBe("Noun fs cstr");
    });

    test("noun absolute, masculine plural", () => {
      expect(
        formatSegmentParsing(
          seg({ part_of_speech: "noun", gender: "masculine", number: "plural", state: "absolute" }),
        ),
      ).toBe("Noun mp abs");
    });

    test("noun determined, feminine dual", () => {
      expect(
        formatSegmentParsing(
          seg({ part_of_speech: "noun", gender: "feminine", number: "dual", state: "determined" }),
        ),
      ).toBe("Noun fd det");
    });

    test("bare preposition has no morphology", () => {
      expect(formatSegmentParsing(seg({ part_of_speech: "preposition" }))).toBe("Preposition");
    });
  });

  describe("person-bearing forms (no state)", () => {
    test("pronoun carries person-gender-number, third feminine plural", () => {
      expect(
        formatSegmentParsing(
          seg({ part_of_speech: "pronoun", person: "third", gender: "feminine", number: "plural" }),
        ),
      ).toBe("Pronoun 3fp");
    });

    test("pronominal suffix, first person common singular", () => {
      expect(
        formatSegmentParsing(
          seg({ part_of_speech: "suffix", person: "first", gender: "common", number: "singular" }),
        ),
      ).toBe("Suffix 1cs");
    });
  });
});

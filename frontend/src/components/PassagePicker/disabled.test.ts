import { describe, expect, test } from "vitest";
import { chapterIsDisabled, endVerseIsDisabled } from "./disabled";

describe("chapterIsDisabled", () => {
  test("undefined threshold disables nothing", () => {
    expect(chapterIsDisabled(1, undefined)).toBe(false);
    expect(chapterIsDisabled(99, undefined)).toBe(false);
  });

  test("chapters strictly before threshold are disabled", () => {
    expect(chapterIsDisabled(1, 3)).toBe(true);
    expect(chapterIsDisabled(2, 3)).toBe(true);
  });

  test("threshold chapter itself is enabled (single-chapter range supported)", () => {
    // The load-bearing < vs <= test. Flipping to <= would silently break
    // single-chapter passage selection: end chapter == start chapter would
    // become unpickable.
    expect(chapterIsDisabled(3, 3)).toBe(false);
  });

  test("chapters after threshold are enabled", () => {
    expect(chapterIsDisabled(4, 3)).toBe(false);
    expect(chapterIsDisabled(99, 3)).toBe(false);
  });
});

describe("endVerseIsDisabled", () => {
  test("different chapter disables nothing, regardless of verse comparison", () => {
    expect(endVerseIsDisabled(1, 16, false)).toBe(false);
    expect(endVerseIsDisabled(15, 16, false)).toBe(false);
    expect(endVerseIsDisabled(16, 16, false)).toBe(false);
    expect(endVerseIsDisabled(17, 16, false)).toBe(false);
  });

  test("same chapter, verses strictly before start are disabled", () => {
    expect(endVerseIsDisabled(1, 16, true)).toBe(true);
    expect(endVerseIsDisabled(15, 16, true)).toBe(true);
  });

  test("same chapter, start verse itself is enabled (single-verse selection supported)", () => {
    // The load-bearing < vs <= test. Flipping to <= would silently break
    // single-verse passage selection: picking the start verse as the end
    // verse would become impossible.
    expect(endVerseIsDisabled(16, 16, true)).toBe(false);
  });

  test("same chapter, verses after start are enabled", () => {
    expect(endVerseIsDisabled(17, 16, true)).toBe(false);
    expect(endVerseIsDisabled(99, 16, true)).toBe(false);
  });
});

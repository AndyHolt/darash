import { describe, expect, test } from "vitest";
import { chapterIsDisabled } from "./chapterDisabled";

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

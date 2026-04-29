import { describe, expect, test } from "vitest";
import { chaptersForBook, lookupBookByName, versesForChapter } from "./books";

const john = lookupBookByName("John");
const thirdJohn = lookupBookByName("3 John");
const psalms = lookupBookByName("Psalms");

describe("chaptersForBook", () => {
  test("returns 1..N for an N-chapter book", () => {
    expect(chaptersForBook(john)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);
  });

  test("single-chapter book returns [1]", () => {
    expect(chaptersForBook(thirdJohn)).toEqual([1]);
  });
});

describe("versesForChapter", () => {
  test("first chapter uses verses[0]", () => {
    expect(versesForChapter(john, 1)).toHaveLength(51);
    expect(versesForChapter(john, 1)[0]).toBe(1);
    expect(versesForChapter(john, 1).at(-1)).toBe(51);
  });

  test("last chapter uses verses[length - 1]", () => {
    expect(versesForChapter(john, 21)).toHaveLength(25);
  });

  test("middle chapter", () => {
    expect(versesForChapter(john, 3)).toHaveLength(36);
  });

  test("single-chapter book", () => {
    expect(versesForChapter(thirdJohn, 1)).toHaveLength(14);
  });

  test("chapter past the end returns empty list", () => {
    expect(versesForChapter(john, 22)).toEqual([]);
  });

  test("chapter 0 returns empty list", () => {
    expect(versesForChapter(john, 0)).toEqual([]);
  });

  test("longest chapter in the bible", () => {
    expect(versesForChapter(psalms, 119)).toHaveLength(176);
  });
});

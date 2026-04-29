import { describe, expect, test } from "vitest";
import { NT_BOOKS } from "@/bible/books";
import { initialStep, type Step, stepReducer } from "./state";

const john = NT_BOOKS.find((b) => b.name === "John")!;
const mark = NT_BOOKS.find((b) => b.name === "Mark")!;

describe("stepReducer", () => {
  test("pickBook moves book → chapter", () => {
    expect(stepReducer(initialStep, { type: "pickBook", book: john })).toEqual({
      step: "chapter",
      book: john,
    });
  });

  test("pickBook from chapter step switches to the new book", () => {
    const chapterState: Step = { step: "chapter", book: john };
    expect(stepReducer(chapterState, { type: "pickBook", book: mark })).toEqual({
      step: "chapter",
      book: mark,
    });
  });

  test("pickChapter moves chapter → verse, keeping book", () => {
    const chapterState: Step = { step: "chapter", book: john };
    expect(stepReducer(chapterState, { type: "pickChapter", chapter: 3 })).toEqual({
      step: "verse",
      book: john,
      chapter: 3,
    });
  });

  test("pickChapter from book step is a no-op", () => {
    expect(stepReducer(initialStep, { type: "pickChapter", chapter: 1 })).toBe(initialStep);
  });

  test("pickChapter from verse step is a no-op", () => {
    const verseState: Step = { step: "verse", book: john, chapter: 3 };
    expect(stepReducer(verseState, { type: "pickChapter", chapter: 5 })).toBe(verseState);
  });

  test("back from verse returns to chapter, keeping book", () => {
    const verseState: Step = { step: "verse", book: john, chapter: 3 };
    expect(stepReducer(verseState, { type: "back" })).toEqual({
      step: "chapter",
      book: john,
    });
  });

  test("back from chapter returns to book", () => {
    const chapterState: Step = { step: "chapter", book: john };
    expect(stepReducer(chapterState, { type: "back" })).toEqual(initialStep);
  });

  test("back from book is a no-op", () => {
    expect(stepReducer(initialStep, { type: "back" })).toBe(initialStep);
  });

  test("reset returns to book step from verse", () => {
    const verseState: Step = { step: "verse", book: john, chapter: 5 };
    expect(stepReducer(verseState, { type: "reset" })).toEqual(initialStep);
  });

  test("reset returns to book step from chapter", () => {
    const chapterState: Step = { step: "chapter", book: john };
    expect(stepReducer(chapterState, { type: "reset" })).toEqual(initialStep);
  });
});

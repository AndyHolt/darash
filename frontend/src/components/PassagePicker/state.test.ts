import { describe, expect, test } from "vitest";
import { lookupBookByName } from "@/bible/books";
import { initialStep, type Step, type StepEvent, stepReducer } from "./state";

const john = lookupBookByName("John");
const mark = lookupBookByName("Mark");

const bookState: Step = initialStep;
const startChapterState: Step = { step: "startChapter", book: john };
const startVerseState: Step = { step: "startVerse", book: john, startChapter: 3 };
const endVerseState: Step = {
  step: "endVerse",
  book: john,
  startChapter: 3,
  startVerse: 16,
  endChapter: 3,
};
const endChapterState: Step = {
  step: "endChapter",
  book: john,
  startChapter: 3,
  startVerse: 16,
  endChapter: 4,
};

type Expected = Step | "noop";

interface Transition {
  from: Step;
  event: StepEvent;
  expected: Expected;
}

const transitions: Transition[] = [
  // from book
  {
    from: bookState,
    event: { type: "pickBook", book: john },
    expected: { step: "startChapter", book: john },
  },
  { from: bookState, event: { type: "pickStartChapter", chapter: 1 }, expected: "noop" },
  { from: bookState, event: { type: "pickStartVerse", verse: 1 }, expected: "noop" },
  { from: bookState, event: { type: "changeEndChapter" }, expected: "noop" },
  { from: bookState, event: { type: "pickEndChapter", chapter: 1 }, expected: "noop" },
  { from: bookState, event: { type: "back" }, expected: "noop" },
  { from: bookState, event: { type: "reset" }, expected: initialStep },

  // from startChapter
  { from: startChapterState, event: { type: "pickBook", book: mark }, expected: "noop" },
  {
    from: startChapterState,
    event: { type: "pickStartChapter", chapter: 3 },
    expected: { step: "startVerse", book: john, startChapter: 3 },
  },
  { from: startChapterState, event: { type: "pickStartVerse", verse: 1 }, expected: "noop" },
  { from: startChapterState, event: { type: "changeEndChapter" }, expected: "noop" },
  { from: startChapterState, event: { type: "pickEndChapter", chapter: 1 }, expected: "noop" },
  { from: startChapterState, event: { type: "back" }, expected: initialStep },
  { from: startChapterState, event: { type: "reset" }, expected: initialStep },

  // from startVerse
  { from: startVerseState, event: { type: "pickBook", book: mark }, expected: "noop" },
  { from: startVerseState, event: { type: "pickStartChapter", chapter: 1 }, expected: "noop" },
  {
    from: startVerseState,
    event: { type: "pickStartVerse", verse: 16 },
    expected: {
      step: "endVerse",
      book: john,
      startChapter: 3,
      startVerse: 16,
      endChapter: 3,
    },
  },
  { from: startVerseState, event: { type: "changeEndChapter" }, expected: "noop" },
  { from: startVerseState, event: { type: "pickEndChapter", chapter: 1 }, expected: "noop" },
  {
    from: startVerseState,
    event: { type: "back" },
    expected: { step: "startChapter", book: john },
  },
  { from: startVerseState, event: { type: "reset" }, expected: initialStep },

  // from endVerse
  { from: endVerseState, event: { type: "pickBook", book: mark }, expected: "noop" },
  { from: endVerseState, event: { type: "pickStartChapter", chapter: 1 }, expected: "noop" },
  { from: endVerseState, event: { type: "pickStartVerse", verse: 1 }, expected: "noop" },
  {
    from: endVerseState,
    event: { type: "changeEndChapter" },
    expected: {
      step: "endChapter",
      book: john,
      startChapter: 3,
      startVerse: 16,
      endChapter: 3,
    },
  },
  { from: endVerseState, event: { type: "pickEndChapter", chapter: 4 }, expected: "noop" },
  {
    from: endVerseState,
    event: { type: "back" },
    expected: { step: "startVerse", book: john, startChapter: 3 },
  },
  { from: endVerseState, event: { type: "reset" }, expected: initialStep },

  // from endChapter
  { from: endChapterState, event: { type: "pickBook", book: mark }, expected: "noop" },
  { from: endChapterState, event: { type: "pickStartChapter", chapter: 1 }, expected: "noop" },
  { from: endChapterState, event: { type: "pickStartVerse", verse: 1 }, expected: "noop" },
  { from: endChapterState, event: { type: "changeEndChapter" }, expected: "noop" },
  {
    from: endChapterState,
    event: { type: "pickEndChapter", chapter: 5 },
    expected: {
      step: "endVerse",
      book: john,
      startChapter: 3,
      startVerse: 16,
      endChapter: 5,
    },
  },
  {
    from: endChapterState,
    event: { type: "back" },
    expected: { step: "startVerse", book: john, startChapter: 3 },
  },
  { from: endChapterState, event: { type: "reset" }, expected: initialStep },
];

// Deriving the arrays from `Record<Union, true>` literals makes the union
// exhaustiveness load-bearing: adding a new variant to Step or StepEvent
// without adding a key here fails to typecheck.
const ALL_STEPS = Object.keys({
  book: true,
  startChapter: true,
  startVerse: true,
  endVerse: true,
  endChapter: true,
} satisfies Record<Step["step"], true>) as Step["step"][];

const ALL_EVENTS = Object.keys({
  pickBook: true,
  pickStartChapter: true,
  pickStartVerse: true,
  changeEndChapter: true,
  pickEndChapter: true,
  back: true,
  reset: true,
} satisfies Record<StepEvent["type"], true>) as StepEvent["type"][];

describe("stepReducer transition table", () => {
  test("table covers every (step × event) combination exactly once", () => {
    const expected = new Set(ALL_STEPS.flatMap((s) => ALL_EVENTS.map((e) => `${s}/${e}`)));
    const actual = transitions.map((t) => `${t.from.step}/${t.event.type}`);
    expect(actual).toHaveLength(expected.size);
    expect(new Set(actual)).toEqual(expected);
  });

  test.each(transitions)("$from.step + $event.type", ({ from, event, expected }) => {
    const result = stepReducer(from, event);
    if (expected === "noop") {
      expect(result).toBe(from);
    } else {
      expect(result).toEqual(expected);
    }
  });
});

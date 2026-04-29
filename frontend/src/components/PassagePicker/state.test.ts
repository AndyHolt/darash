import { describe, expect, test } from "vitest";
import { lookupBookByName } from "@/bible/books";
import { initialStep, type Step, type StepEvent, stepReducer } from "./state";

const john = lookupBookByName("John");
const mark = lookupBookByName("Mark");

const bookState: Step = initialStep;
const chapterState: Step = { step: "chapter", book: john };
const verseState: Step = { step: "verse", book: john, chapter: 3 };

type Expected = Step | "noop";

interface Transition {
  from: Step;
  event: StepEvent;
  expected: Expected;
}

const transitions: Transition[] = [
  // from book step
  {
    from: bookState,
    event: { type: "pickBook", book: john },
    expected: { step: "chapter", book: john },
  },
  { from: bookState, event: { type: "pickChapter", chapter: 1 }, expected: "noop" },
  { from: bookState, event: { type: "back" }, expected: "noop" },
  { from: bookState, event: { type: "reset" }, expected: initialStep },

  // from chapter step
  { from: chapterState, event: { type: "pickBook", book: mark }, expected: "noop" },
  {
    from: chapterState,
    event: { type: "pickChapter", chapter: 3 },
    expected: { step: "verse", book: john, chapter: 3 },
  },
  { from: chapterState, event: { type: "back" }, expected: initialStep },
  { from: chapterState, event: { type: "reset" }, expected: initialStep },

  // from verse step
  { from: verseState, event: { type: "pickBook", book: mark }, expected: "noop" },
  { from: verseState, event: { type: "pickChapter", chapter: 5 }, expected: "noop" },
  { from: verseState, event: { type: "back" }, expected: { step: "chapter", book: john } },
  { from: verseState, event: { type: "reset" }, expected: initialStep },
];

// Deriving the arrays from `Record<Union, true>` literals makes the union
// exhaustiveness load-bearing: adding a new variant to Step or StepEvent
// without adding a key here fails to typecheck.
const ALL_STEPS = Object.keys({
  book: true,
  chapter: true,
  verse: true,
} satisfies Record<Step["step"], true>) as Step["step"][];

const ALL_EVENTS = Object.keys({
  pickBook: true,
  pickChapter: true,
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

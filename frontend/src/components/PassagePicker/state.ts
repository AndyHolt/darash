import type { BookInfo } from "@/bible/books";

export type Step =
  | { step: "book" }
  | { step: "startChapter"; book: BookInfo }
  | { step: "startVerse"; book: BookInfo; startChapter: number }
  | {
      step: "endVerse";
      book: BookInfo;
      startChapter: number;
      startVerse: number;
      endChapter: number;
    }
  | {
      step: "endChapter";
      book: BookInfo;
      startChapter: number;
      startVerse: number;
      endChapter: number;
    };

export type StepEvent =
  | { type: "pickBook"; book: BookInfo }
  | { type: "pickStartChapter"; chapter: number }
  | { type: "pickStartVerse"; verse: number }
  | { type: "changeEndChapter" }
  | { type: "pickEndChapter"; chapter: number }
  | { type: "back" }
  | { type: "reset" };

export const initialStep: Step = { step: "book" };

export function stepReducer(state: Step, event: StepEvent): Step {
  switch (event.type) {
    case "pickBook":
      if (state.step !== "book") return state;
      return { step: "startChapter", book: event.book };
    case "pickStartChapter":
      if (state.step !== "startChapter") return state;
      return { step: "startVerse", book: state.book, startChapter: event.chapter };
    case "pickStartVerse":
      if (state.step !== "startVerse") return state;
      return {
        step: "endVerse",
        book: state.book,
        startChapter: state.startChapter,
        startVerse: event.verse,
        endChapter: state.startChapter,
      };
    case "changeEndChapter":
      if (state.step !== "endVerse") return state;
      return {
        step: "endChapter",
        book: state.book,
        startChapter: state.startChapter,
        startVerse: state.startVerse,
        endChapter: state.endChapter,
      };
    case "pickEndChapter":
      if (state.step !== "endChapter") return state;
      return {
        step: "endVerse",
        book: state.book,
        startChapter: state.startChapter,
        startVerse: state.startVerse,
        endChapter: event.chapter,
      };
    case "back":
      switch (state.step) {
        case "book":
          return state;
        case "startChapter":
          return { step: "book" };
        case "startVerse":
          return { step: "startChapter", book: state.book };
        case "endVerse":
          return {
            step: "startVerse",
            book: state.book,
            startChapter: state.startChapter,
          };
        case "endChapter":
          return {
            step: "startVerse",
            book: state.book,
            startChapter: state.startChapter,
          };
        default: {
          const _exhaustive: never = state;
          throw new Error(`unhandled step: ${(_exhaustive as Step).step}`);
        }
      }
    case "reset":
      return initialStep;
    default: {
      const _exhaustive: never = event;
      throw new Error(`unhandled event: ${(_exhaustive as StepEvent).type}`);
    }
  }
}

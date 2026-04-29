import type { BookInfo } from "@/bible/books";

export type Step =
  | { step: "book" }
  | { step: "chapter"; book: BookInfo }
  | { step: "verse"; book: BookInfo; chapter: number };

export type StepEvent =
  | { type: "pickBook"; book: BookInfo }
  | { type: "pickChapter"; chapter: number }
  | { type: "back" }
  | { type: "reset" };

export const initialStep: Step = { step: "book" };

export function stepReducer(state: Step, event: StepEvent): Step {
  switch (event.type) {
    case "pickBook":
      if (state.step !== "book") return state;
      return { step: "chapter", book: event.book };
    case "pickChapter":
      if (state.step !== "chapter") return state;
      return { step: "verse", book: state.book, chapter: event.chapter };
    case "back":
      switch (state.step) {
        case "book":
          return state;
        case "chapter":
          return { step: "book" };
        case "verse":
          return { step: "chapter", book: state.book };
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

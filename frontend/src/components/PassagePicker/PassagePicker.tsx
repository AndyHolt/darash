import { ChevronDown, Loader2 } from "lucide-react";
import { useReducer } from "react";
import type { Reference } from "@/bible/references";
import { formatReference, parseReferenceUrlTag } from "@/bible/references";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BackButton } from "./BackButton";
import { BookPicker } from "./BookPicker";
import { ChapterPicker } from "./ChapterPicker";
import { EndVersePicker } from "./EndVersePicker";
import { StartVersePicker } from "./StartVersePicker";
import { initialStep, type Step, stepReducer } from "./state";

// Resolved state of the active text's passage query, supplied by the route
// layout so the picker itself stays text-agnostic — it only reads this to
// render the trigger label and loading spinner.
export interface PassageQueryState {
  passage: { reference: Reference } | undefined;
  isLoading: boolean;
  failureCount: number;
}

export interface PassagePickerProps {
  passageRef?: string;
  query?: PassageQueryState;
}

export function PassagePicker({ passageRef, query }: PassagePickerProps) {
  const { passage, isLoading = false, failureCount = 0 } = query ?? {};
  // `isError` only flips once retries are exhausted, so a failing-then-retrying
  // query still reports `isLoading: true` and would keep the spinner up while
  // the route's error UI is on screen. `failureCount` increments on the first
  // failed attempt, giving us the earlier signal we need to stop the spinner.
  const hasFailed = failureCount > 0;
  const [step, dispatch] = useReducer(stepReducer, initialStep);

  function handleOpenChange(open: boolean) {
    if (!open) {
      dispatch({ type: "reset" });
    }
  }

  function renderStep() {
    switch (step.step) {
      case "book":
        return (
          <BookPicker
            testament="New Testament"
            pickBook={(book) => dispatch({ type: "pickBook", book })}
          />
        );
      case "startChapter":
        return (
          <ChapterPicker
            book={step.book}
            pickChapter={(chapter) => dispatch({ type: "pickStartChapter", chapter })}
          />
        );
      case "startVerse":
        return (
          <StartVersePicker
            book={step.book}
            chapter={step.startChapter}
            pickVerse={(verse) => dispatch({ type: "pickStartVerse", verse })}
          />
        );
      case "endVerse":
        return (
          <EndVersePicker
            book={step.book}
            startChapter={step.startChapter}
            startVerse={step.startVerse}
            endChapter={step.endChapter}
          />
        );
      case "endChapter":
        return (
          <ChapterPicker
            book={step.book}
            pickChapter={(chapter) => dispatch({ type: "pickEndChapter", chapter })}
            disabledBefore={step.startChapter}
          />
        );
      default: {
        const _exhaustive: never = step;
        throw new Error(`unhandled step: ${(_exhaustive as Step).step}`);
      }
    }
  }

  function renderStepDescription() {
    switch (step.step) {
      case "book":
        return "Select book";
      case "startChapter":
        return "Select chapter";
      case "startVerse":
        return "Select start verse";
      case "endVerse":
        return "Select end verse, or click chapter to change";
      case "endChapter":
        return "Select end chapter";
      default: {
        const _exhaustive: never = step;
        throw new Error(`unhandled step: ${(_exhaustive as Step).step}`);
      }
    }
  }

  function stepControl(title: string, onTitleClick?: () => void) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <BackButton onClick={() => dispatch({ type: "back" })} />
        {onTitleClick ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${title} (change chapter)`}
            onClick={onTitleClick}
          >
            <h2 className="text-sm font-normal">{title}</h2>
            <ChevronDown />
          </Button>
        ) : (
          <h2 className="text-sm font-normal">{title}</h2>
        )}
      </div>
    );
  }

  function renderStepControl() {
    switch (step.step) {
      case "book":
        return null;
      case "startChapter":
        return stepControl(step.book.name);
      case "startVerse":
        return stepControl(`${step.book.name} ${step.startChapter}`);
      case "endVerse":
        return stepControl(`${step.book.name} ${step.endChapter}`, () =>
          dispatch({ type: "changeEndChapter" }),
        );
      case "endChapter":
        return stepControl(step.book.name);
      default: {
        const _exhaustive: never = step;
        throw new Error(`unhandled step: ${(_exhaustive as Step).step}`);
      }
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {triggerLabel(passageRef, passage)}
          {isLoading && !hasFailed ? <Loader2 className="animate-spin" /> : <ChevronDown />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-72 p-2">
        <PopoverHeader>
          <PopoverTitle>Choose passage</PopoverTitle>
          <PopoverDescription>{renderStepDescription()}</PopoverDescription>
        </PopoverHeader>
        {renderStepControl()}
        {renderStep()}
      </PopoverContent>
    </Popover>
  );
}

function triggerLabel(
  passageRef: string | undefined,
  passage: { reference: Reference } | undefined,
): string {
  if (passage) return formatReference(passage.reference);
  if (passageRef) return pendingLabel(passageRef);
  return "Choose passage";
}

// Before the server has returned we don't yet have a canonicalised reference
// to display, so derive a label from the URL slug. A malformed slug (also the
// shape an erroring request takes — passage stays undefined) shouldn't crash
// the header; fall back to the same prompt as the no-ref case so the picker
// invites the user to pick rather than implying a load is in progress.
function pendingLabel(passageRef: string): string {
  try {
    return formatReference(parseReferenceUrlTag(passageRef));
  } catch {
    return "Choose passage";
  }
}

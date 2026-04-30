import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useReducer } from "react";
import { formatReference } from "@/bible/references";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { passageQuery } from "@/texts/morphgnt";
import { BackButton } from "./BackButton";
import { BookPicker } from "./BookPicker";
import { ChapterPicker } from "./ChapterPicker";
import { EndVersePicker } from "./EndVersePicker";
import { StartVersePicker } from "./StartVersePicker";
import { initialStep, type Step, stepReducer } from "./state";

export interface PassagePickerProps {
  passageRef: string;
}

export function PassagePicker({ passageRef }: PassagePickerProps) {
  const { data: passage } = useQuery(passageQuery(passageRef));
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
          {passage ? formatReference(passage.reference) : "Select passage"}
          <ChevronDown />
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

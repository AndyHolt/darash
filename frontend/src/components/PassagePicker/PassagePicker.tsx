import { useQuery } from "@tanstack/react-query";
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
import { initialStep, type Step, stepReducer } from "./state";
import { VersePicker } from "./VersePicker";

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
      case "chapter":
        return (
          <ChapterPicker
            book={step.book}
            pickChapter={(chapter) => dispatch({ type: "pickChapter", chapter })}
          />
        );
      case "verse":
        return <VersePicker book={step.book} chapter={step.chapter} />;
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
      case "chapter":
        return "Select chapter";
      case "verse":
        return "Select verse";
      default: {
        const _exhaustive: never = step;
        throw new Error(`unhandled step: ${(_exhaustive as Step).step}`);
      }
    }
  }

  function renderStepControl() {
    switch (step.step) {
      case "book":
        return null;
      case "chapter":
        return (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <BackButton onClick={() => dispatch({ type: "back" })} />
            <h2>{step.book.name}</h2>
          </div>
        );
      case "verse":
        return (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <BackButton onClick={() => dispatch({ type: "back" })} />
            <h2>
              {step.book.name} {step.chapter}
            </h2>
          </div>
        );
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

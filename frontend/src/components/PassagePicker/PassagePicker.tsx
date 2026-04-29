import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { BookInfo } from "@/bible/books";
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
import { VersePicker } from "./VersePicker";

interface BookStep {
  step: "book";
}

interface ChapterStep {
  step: "chapter";
  book: BookInfo;
}

interface VerseStep {
  step: "verse";
  book: BookInfo;
  chapter: number;
}

type Step = BookStep | ChapterStep | VerseStep;

export interface PassagePickerProps {
  passageRef: string;
}

export function PassagePicker({ passageRef }: PassagePickerProps) {
  const { data: passage } = useQuery(passageQuery(passageRef));
  const [step, setStep] = useState<Step>({ step: "book" });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setStep({ step: "book" } as const satisfies BookStep);
    }
  }

  function setBook(book: BookInfo) {
    setStep({
      ...step,
      step: "chapter",
      book: book,
    } as const satisfies ChapterStep);
  }

  function setChapter(chapter: number) {
    setStep({
      step: "verse",
      book: (step as ChapterStep).book,
      chapter: chapter,
    } as const satisfies VerseStep);
  }

  function renderStep() {
    switch (step.step) {
      case "book":
        return <BookPicker testament="New Testament" pickBook={setBook} />;
      case "chapter":
        return <ChapterPicker book={step.book} pickChapter={setChapter} />;
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

  function handleBack() {
    switch (step.step) {
      case "book":
        console.warn("Back button pressed on book step");
        return;
      case "chapter":
        setStep({
          step: "book",
        } as const satisfies BookStep);
        return;
      case "verse":
        setStep({
          step: "chapter",
          book: step.book,
        } as const satisfies ChapterStep);
        return;
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
            <BackButton onClick={() => handleBack()} />
            <h1>{step.book.name}</h1>
          </div>
        );
      case "verse":
        return (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <BackButton onClick={() => handleBack()} />
            <h1>
              {step.book.name} {step.chapter}
            </h1>
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

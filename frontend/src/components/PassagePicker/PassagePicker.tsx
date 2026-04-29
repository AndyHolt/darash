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
          <PopoverDescription>Select first verse</PopoverDescription>
        </PopoverHeader>
        {renderStep()}
      </PopoverContent>
    </Popover>
  );
}

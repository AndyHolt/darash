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

export interface PassagePickerProps {
  passageRef: string;
}

export function PassagePicker({ passageRef }: PassagePickerProps) {
  const { data: passage } = useQuery(passageQuery(passageRef));
  // TODO use book config for state, to avoid look of config in both chapter and verse components
  const [book, setBook] = useState<BookInfo>();
  const [chapter, setChapter] = useState<number>();

  return (
    <Popover>
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
        {book ? (
          <span>{book.name}</span>
        ) : (
          <BookPicker testament="New Testament" pickBook={setBook} />
        )}
        {book && !chapter && <ChapterPicker book={book} pickChapter={setChapter} />}
        {book && chapter && <VersePicker book={book} chapter={chapter} />}
      </PopoverContent>
    </Popover>
  );
}

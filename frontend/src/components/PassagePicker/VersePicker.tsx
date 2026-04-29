import { Link } from "@tanstack/react-router";
import type { BookInfo } from "@/bible/books";
import { referenceUrlTag } from "@/bible/references";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";

export interface VersePickerProps {
  book: BookInfo;
  chapter: number;
}

export function VersePicker({ book, chapter }: VersePickerProps) {
  const verses = Array.from({ length: book.verses[chapter - 1] }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 gap-1">
      {verses.map((n) => (
        <PopoverClose key={n} asChild>
          <Button variant="ghost" asChild>
            <Link
              to="/sblgnt/$passageRef"
              params={{
                passageRef: referenceUrlTag({
                  kind: "verse",
                  book: book.name,
                  chapter: chapter,
                  verse: n,
                }),
              }}
            >
              {n}
            </Link>
          </Button>
        </PopoverClose>
      ))}
    </div>
  );
}

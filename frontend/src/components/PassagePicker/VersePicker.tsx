import { Link } from "@tanstack/react-router";
import type { BookInfo } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface VersePickerProps {
  book: BookInfo;
  chapter: number;
}

function createRoute(book: BookInfo, chapter: number, verse: number) {
  return `/sblgnt/${book.abbrev.toLowerCase()}.${chapter}.${verse}`;
}

export function VersePicker({ book, chapter }: VersePickerProps) {
  const verses = Array.from({ length: book.verses[chapter - 1] }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 gap-1">
      {verses.map((n) => (
        <Button key={n} variant="ghost" asChild>
          <Link to={createRoute(book, chapter, n)}>{n}</Link>
        </Button>
      ))}
    </div>
  );
}

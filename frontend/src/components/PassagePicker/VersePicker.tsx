import { Link } from "@tanstack/react-router";
import { BOOKS, type Book } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface VersePickerProps {
  book: Book;
  chapter: number;
}

function createRoute(book: Book, chapter: number, verse: number) {
  return `/sblgnt/${book}.${chapter}.${verse}`;
}

export function VersePicker({ book, chapter }: VersePickerProps) {
  const bookConfig = BOOKS.find((b) => b.name === book);
  const numVerses = bookConfig?.verses[chapter] ?? 0;

  const verses = Array.from({ length: numVerses }, (_, i) => i + 1);

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

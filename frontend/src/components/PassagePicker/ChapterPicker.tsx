import { BOOKS, type Book } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface ChapterPickerProps {
  book: Book;
  pickChapter: (chapter: number) => void;
}

export function ChapterPicker({ book, pickChapter }: ChapterPickerProps) {
  const bookConfig = BOOKS.find((b) => b.name === book);
  const numChapters = bookConfig?.verses.length ?? 0;

  const chapters = Array.from({ length: numChapters }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 gap-1">
      {chapters.map((n) => (
        <Button key={n} variant="ghost" size="sm" onClick={() => pickChapter(n)}>
          {n}
        </Button>
      ))}
    </div>
  );
}

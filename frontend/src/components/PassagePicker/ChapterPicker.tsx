import type { BookInfo } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface ChapterPickerProps {
  book: BookInfo;
  pickChapter: (chapter: number) => void;
}

export function ChapterPicker({ book, pickChapter }: ChapterPickerProps) {
  const chapters = Array.from({ length: book.verses.length }, (_, i) => i + 1);

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

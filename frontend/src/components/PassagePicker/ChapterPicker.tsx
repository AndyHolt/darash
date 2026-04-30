import { type BookInfo, chaptersForBook } from "@/bible/books";
import { Button } from "@/components/ui/button";
import { chapterIsDisabled } from "./disabled";

export interface ChapterPickerProps {
  book: BookInfo;
  pickChapter: (chapter: number) => void;
  disabledBefore?: number;
}

export function ChapterPicker({ book, pickChapter, disabledBefore }: ChapterPickerProps) {
  const chapters = chaptersForBook(book);

  return (
    <div className="grid grid-cols-5 gap-1">
      {chapters.map((n) => (
        <Button
          key={n}
          variant="ghost"
          size="sm"
          disabled={chapterIsDisabled(n, disabledBefore)}
          onClick={() => pickChapter(n)}
        >
          {n}
        </Button>
      ))}
    </div>
  );
}

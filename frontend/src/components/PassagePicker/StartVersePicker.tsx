import { type BookInfo, versesForChapter } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface StartVersePickerProps {
  book: BookInfo;
  chapter: number;
  pickVerse: (verse: number) => void;
}

export function StartVersePicker({ book, chapter, pickVerse }: StartVersePickerProps) {
  const verses = versesForChapter(book, chapter);

  return (
    <div className="grid grid-cols-5 gap-1">
      {verses.map((n) => (
        <Button key={n} variant="ghost" size="sm" onClick={() => pickVerse(n)}>
          {n}
        </Button>
      ))}
    </div>
  );
}

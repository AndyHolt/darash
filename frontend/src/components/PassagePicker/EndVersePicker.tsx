import { Link } from "@tanstack/react-router";
import { type BookInfo, versesForChapter } from "@/bible/books";
import { passageReference, referenceUrlTag } from "@/bible/references";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";
import { endVerseIsDisabled } from "./disabled";

export interface EndVersePickerProps {
  book: BookInfo;
  startChapter: number;
  startVerse: number;
  endChapter: number;
}

export function EndVersePicker({
  book,
  startChapter,
  startVerse,
  endChapter,
}: EndVersePickerProps) {
  const verses = versesForChapter(book, endChapter);
  const sameChapter = endChapter === startChapter;

  return (
    <div className="grid grid-cols-5 gap-1">
      {verses.map((n) => {
        if (endVerseIsDisabled(n, startVerse, sameChapter)) {
          return (
            <Button key={n} variant="ghost" size="sm" disabled>
              {n}
            </Button>
          );
        }
        const isStart = sameChapter && n === startVerse;
        const passageRef = referenceUrlTag(
          passageReference(
            { book: book.name, chapter: startChapter, verse: startVerse },
            { book: book.name, chapter: endChapter, verse: n },
          ),
        );
        return (
          <PopoverClose key={n} asChild>
            <Button variant={isStart ? "secondary" : "ghost"} size="sm" asChild>
              <Link to="/sblgnt/$passageRef" params={{ passageRef }}>
                {n}
              </Link>
            </Button>
          </PopoverClose>
        );
      })}
    </div>
  );
}

import type { BookInfo } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface BookPickerProps {
  books: readonly BookInfo[];
  pickBook: (book: BookInfo) => void;
}

export function BookPicker({ books, pickBook }: BookPickerProps) {
  return (
    <div className="columns-2 md:columns-3 gap-1">
      {books.map((b) => (
        <Button
          key={b.name}
          variant="ghost"
          size="sm"
          className="mb-1 flex w-full justify-start break-inside-avoid"
          onClick={() => pickBook(b)}
        >
          {b.name}
        </Button>
      ))}
    </div>
  );
}

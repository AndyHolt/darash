import type { BookInfo, Testament } from "@/bible/books";
import { NT_BOOKS, OT_BOOKS } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface BookPickerProps {
  testament: Testament;
  pickBook: (book: BookInfo) => void;
}

export function BookPicker({ testament, pickBook }: BookPickerProps) {
  const books = testament === "Old Testament" ? OT_BOOKS : NT_BOOKS;

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

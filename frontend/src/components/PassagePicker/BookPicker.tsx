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
    <div className="grid grid-flow-col grid-rows-9 gap-1">
      {books.map((b) => (
        <Button
          key={b.name}
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => pickBook(b)}
        >
          {b.name}
        </Button>
      ))}
    </div>
  );
}

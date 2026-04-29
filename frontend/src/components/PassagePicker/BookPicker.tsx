import type { NTBook } from "@/bible/books";
import { NT_BOOKS } from "@/bible/books";
import { Button } from "@/components/ui/button";

export interface BookPickerProps {
  pickBook: (book: NTBook) => void;
}

export function BookPicker({ pickBook }: BookPickerProps) {
  return (
    <div className="grid grid-flow-col grid-rows-9 gap-1">
      {NT_BOOKS.map((b) => (
        <Button
          key={b.name}
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => pickBook(b.name)}
        >
          {b.name}
        </Button>
      ))}
    </div>
  );
}

import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import type { Word } from "@/texts/morphgnt";
import { formatParsing } from "./parsing";

export interface ParsingCardProps {
  word: Word;
}

export function ParsingCard({ word }: ParsingCardProps) {
  return (
    <Item variant="outline" className="my-2" size="xs">
      <ItemContent>
        <ItemTitle>{word.text_word}</ItemTitle>
        <ItemDescription>{formatParsing(word)}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

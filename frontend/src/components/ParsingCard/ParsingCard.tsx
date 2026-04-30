import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import type { Word } from "@/texts/morphgnt";

export interface ParsingCardProps {
  word: Word;
}

function parsingCode(word: Word) {
  const codes = [
    word.person,
    word.tense,
    word.voice,
    word.mood,
    word.case,
    word.number,
    word.gender,
    word.degree,
  ];

  const formattedCodes = codes.filter((c) => !!c).join(" ");

  return `${word.part_of_speech}: ${formattedCodes} from ${word.lemma}`;
}

export function ParsingCard({ word }: ParsingCardProps) {
  return (
    <Item variant="outline" className="my-2" size="xs">
      <ItemContent>
        <ItemTitle>{word.text_word}</ItemTitle>
        <ItemDescription>{parsingCode(word)}</ItemDescription>
      </ItemContent>
    </Item>
  );
}

import { useEffect, useRef } from "react";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import type { Word } from "@/texts/morphgnt";
import { formatParsing } from "./parsing";

export interface ParsingCardProps {
  word: Word;
  focused?: boolean;
  pinned?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function ParsingCard({
  word,
  focused,
  pinned,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ParsingCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pinned) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [pinned]);

  return (
    <Item
      ref={ref}
      variant="default"
      size="xs"
      data-focused={focused ? "true" : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="cursor-pointer transition-shadow data-[focused=true]:ring-2 data-[focused=true]:ring-primary"
    >
      <ItemContent>
        <ItemTitle className="font-greek">{word.text_word}</ItemTitle>
        <ItemDescription>
          {formatParsing(word)} <span className="italic">from</span>{" "}
          <span className="font-greek">{word.lemma}</span>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

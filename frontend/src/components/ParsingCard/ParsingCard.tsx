import { useEffect, useRef } from "react";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import type { Word } from "@/texts/morphgnt";
import { formatGloss } from "./gloss";
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
      className="cursor-pointer transition-colors data-[focused=true]:bg-sidebar-accent data-[focused=true]:text-sidebar-primary"
    >
      <ItemContent>
        <ItemTitle className="font-greek">{word.text_word}</ItemTitle>
        <ItemDescription>
          <div>
            <Parsing word={word} />
          </div>
          <div>
            <Gloss word={word} />
          </div>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

function Parsing({ word }: { word: Word }) {
  return (
    <>
      {formatParsing(word)} <span className="italic">from</span>{" "}
      <span className="font-greek text-xs">{word.lemma}</span>
    </>
  );
}

function Gloss({ word }: { word: Word }) {
  const text = formatGloss(word);
  return text ? text : null;
}

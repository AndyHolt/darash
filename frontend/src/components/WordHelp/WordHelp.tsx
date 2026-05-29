import { ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type { Word } from "@/texts/morphgnt";
import { formatGloss } from "./gloss";
import { MeaningText } from "./MeaningText";
import { meaningsOf } from "./meaning";
import { formatParsing } from "./parsing";

export interface WordHelpProps {
  word: Word;
  focused?: boolean;
  pinned?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function WordHelp({
  word,
  focused,
  pinned,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: WordHelpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const meanings = meaningsOf(word);

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
        <WordDataRow>
          <Parsing word={word} />
        </WordDataRow>
        <Gloss word={word} meanings={meanings} />
      </ItemContent>
    </Item>
  );
}

function WordDataRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-left text-sm leading-normal font-normal text-sidebar-muted-foreground group-data-[size=xs]/item:text-xs",
        className,
      )}
      {...props}
    />
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

function Gloss({ word, meanings }: { word: Word; meanings: string[] }) {
  const text = formatGloss(word);
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  if (meanings.length === 0) {
    return <WordDataRow>{text}</WordDataRow>;
  }

  return (
    <WordDataRow>
      <button
        type="button"
        aria-expanded={expanded}
        // Stop the card's click handler from also pinning/unpinning the word.
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="group/gloss inline-flex items-center gap-0.5 text-left text-inherit hover:text-sidebar-foreground transition-colors"
      >
        <span className="group-hover/gloss:decoration-sidebar-foreground/60">{text}</span>
        <ChevronRight
          className={cn("size-3 shrink-0 transition-transform", expanded && "rotate-90")}
        />
      </button>
      {expanded && (
        <div className="definition mt-1 text-xs leading-relaxed font-lexicon">
          {meanings.map((markup, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lexicon entries for a word are a fixed list that is never reordered.
            <p key={i} className={cn(i > 0 && "mt-2")}>
              <MeaningText markup={markup} />
            </p>
          ))}
        </div>
      )}
    </WordDataRow>
  );
}

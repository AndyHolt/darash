import { ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
      <div className="flex items-center justify-between">
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
        <WordFreqStats word={word} />
      </div>
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

function FreqRow({
  word,
  kind,
  count,
  rank,
}: {
  word: string;
  kind: "form" | "lemma";
  count: number;
  rank: number;
}) {
  return (
    <tr>
      <th scope="row" className="pr-3 text-left font-normal">
        <span className="font-greek">{word}</span>{" "}
        <span className="text-sidebar-muted-foreground">({kind})</span>
      </th>
      <td className="pr-3 tabular-nums">{count}×</td>
      <td className="tabular-nums text-sidebar-muted-foreground"># {rank}</td>
    </tr>
  );
}

function WordFreqStats({ word }: { word: Word }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Stop the card's click handler from also pinning/unpinning the word.
          onClick={(e) => e.stopPropagation()}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") {
              cancelClose();
              setOpen(true);
            }
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") scheduleClose();
          }}
          className="font-mono text-xs tabular-nums text-sidebar-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          {word.normalized_count}/{word.lemma_count}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-auto max-w-xs gap-2 text-xs"
        onPointerEnter={cancelClose}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") scheduleClose();
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <table className="border-collapse">
          <caption className="sr-only">Frequency in the SBLGNT</caption>
          <tbody>
            <FreqRow
              word={word.normalized}
              kind="form"
              count={word.normalized_count}
              rank={word.normalized_rank}
            />
            <FreqRow
              word={word.lemma}
              kind="lemma"
              count={word.lemma_count}
              rank={word.lemma_rank}
            />
          </tbody>
        </table>
        <p className="text-sidebar-muted-foreground border-t pt-2">
          Shown as{" "}
          <span className="font-mono tabular-nums">
            {word.normalized_count}/{word.lemma_count}
          </span>{" "}
          — occurrences of this exact form / of any form sharing this lemma.
        </p>
      </PopoverContent>
    </Popover>
  );
}

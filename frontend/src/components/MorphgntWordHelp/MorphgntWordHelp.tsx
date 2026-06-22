import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { ItemTitle } from "@/components/ui/item";
import { FreqRow, FreqStatsPopover } from "@/components/WordHelp/FreqStats";
import { WordDataRow, WordHelp } from "@/components/WordHelp/WordHelp";
import { useWordHelpSettings } from "@/components/WordHelpSettings/state";
import { cn } from "@/lib/utils";
import type { Word } from "@/texts/morphgnt";
import { formatGloss } from "./gloss";
import { MeaningText } from "./MeaningText";
import { meaningsOf } from "./meaning";
import { formatParsing } from "./parsing";

export interface MorphgntWordHelpProps {
  word: Word;
  focused?: boolean;
  pinned?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function MorphgntWordHelp({
  word,
  focused,
  pinned,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: MorphgntWordHelpProps) {
  const meanings = meaningsOf(word);

  return (
    <WordHelp
      focused={focused}
      pinned={pinned}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <ItemTitle className="font-greek">{word.text_word}</ItemTitle>
      <WordDataRow>
        <Parsing word={word} />
      </WordDataRow>
      <Gloss word={word} meanings={meanings} />
    </WordHelp>
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
  const [{ showFrequencyStats }] = useWordHelpSettings();

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
        {showFrequencyStats && <WordFreqStats word={word} />}
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

function WordFreqStats({ word }: { word: Word }) {
  return (
    <FreqStatsPopover
      triggerLabel={
        <>
          {word.normalized_count}/{word.lemma_count}
        </>
      }
    >
      <table className="border-collapse">
        <caption className="sr-only">Frequency in the SBLGNT</caption>
        <tbody>
          <FreqRow
            label={<span className="font-greek">{word.normalized}</span>}
            kind="form"
            count={word.normalized_count}
            rank={word.normalized_rank}
          />
          <FreqRow
            label={<span className="font-greek">{word.lemma}</span>}
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
    </FreqStatsPopover>
  );
}

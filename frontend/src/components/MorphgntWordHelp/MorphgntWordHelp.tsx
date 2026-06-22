import { ItemTitle } from "@/components/ui/item";
import { Disclosure } from "@/components/WordHelp/Disclosure";
import { WordFreqStats } from "@/components/WordHelp/FreqStats";
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
  const [{ showFrequencyStats }] = useWordHelpSettings();

  if (!text) return null;

  const stats = showFrequencyStats ? (
    <WordFreqStats
      corpus="SBLGNT"
      formLabel={<span className="font-greek">{word.normalized}</span>}
      lemmaLabel={<span className="font-greek">{word.lemma}</span>}
      counts={{
        form_count: word.normalized_count,
        form_rank: word.normalized_rank,
        lemma_count: word.lemma_count,
        lemma_rank: word.lemma_rank,
      }}
    />
  ) : null;

  // No lexicon entries: render the gloss as plain text, with frequency stats
  // alongside (stats always show when enabled, regardless of definition depth).
  if (meanings.length === 0) {
    return (
      <WordDataRow className="flex items-center justify-between">
        <span>{text}</span>
        {stats}
      </WordDataRow>
    );
  }

  return (
    <WordDataRow>
      <Disclosure summary={text} trailing={stats}>
        <DefinitionList meanings={meanings} />
      </Disclosure>
    </WordDataRow>
  );
}

function DefinitionList({ meanings }: { meanings: string[] }) {
  return (
    <div className="definition mt-1 text-xs leading-relaxed font-lexicon">
      {meanings.map((markup, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lexicon entries for a word are a fixed list that is never reordered.
        <p key={i} className={cn(i > 0 && "mt-2")}>
          <MeaningText markup={markup} />
        </p>
      ))}
    </div>
  );
}

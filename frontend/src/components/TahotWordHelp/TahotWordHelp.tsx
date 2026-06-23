import { ItemTitle } from "@/components/ui/item";
import {
  WordDataRow,
  WordFreqStats,
  WordHelp,
  type WordHelpInteraction,
} from "@/components/WordHelp";
import { useWordHelpSettings } from "@/components/WordHelpSettings";
import {
  cleanGloss,
  formatSegmentParsing,
  type Word,
  type WordSegment,
  wordDisplayHebrew,
} from "@/texts/tahot";

export interface TahotWordHelpProps extends WordHelpInteraction {
  word: Word;
}

/**
 * Hebrew word-help card: composes the text-agnostic {@link WordHelp} base with a
 * morpheme-segment breakdown. Unlike the Greek card there is no lexicon
 * `meaning` data yet, so each segment shows only its parsing label and gloss —
 * the disclosure/definition seam is intentionally left for when lexicon entries
 * land.
 */
export function TahotWordHelp({ word, ...interaction }: TahotWordHelpProps) {
  // Punctuation segments (sof-passuq, petuhah/setumah markers) carry no
  // morphology or gloss, so they get no row.
  const segments = word.segments.filter((s) => s.kind !== "punctuation");
  const [{ showFrequencyStats }] = useWordHelpSettings();

  return (
    <WordHelp {...interaction}>
      <div className="flex items-baseline justify-between gap-2">
        <ItemTitle className="font-hebrew text-base" dir="rtl">
          {wordDisplayHebrew(word)}
        </ItemTitle>
        {showFrequencyStats ? <FreqStats word={word} /> : null}
      </div>
      {word.transliteration ? (
        <WordDataRow className="italic">{word.transliteration}</WordDataRow>
      ) : null}
      {segments.map((seg) => (
        <SegmentRow key={seg.segment_index} seg={seg} />
      ))}
    </WordHelp>
  );
}

function SegmentRow({ seg }: { seg: WordSegment }) {
  const parsing = formatSegmentParsing(seg);
  const gloss = cleanGloss(seg.gloss);

  return (
    <WordDataRow className="flex items-baseline gap-2">
      <span className="font-hebrew shrink-0" dir="rtl">
        {seg.hebrew}
      </span>
      <span className="flex-1">
        {parsing}
        {parsing && gloss ? " — " : null}
        {gloss ? <span className="italic">{gloss}</span> : null}
      </span>
    </WordDataRow>
  );
}

function FreqStats({ word }: { word: Word }) {
  // The Hebrew lemma is the root morpheme; fall back to the surface form when a
  // word has no distinct root segment (e.g. standalone particles).
  const root = word.segments.find((s) => s.kind === "root")?.hebrew;
  return (
    <WordFreqStats
      corpus="TAHOT"
      formLabel={
        <span className="font-hebrew" dir="rtl">
          {wordDisplayHebrew(word)}
        </span>
      }
      lemmaLabel={
        <span className="font-hebrew" dir="rtl">
          {root ?? wordDisplayHebrew(word)}
        </span>
      }
      counts={word}
    />
  );
}

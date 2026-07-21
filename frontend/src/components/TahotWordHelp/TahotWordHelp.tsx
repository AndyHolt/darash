import { ItemTitle } from "@/components/ui/item";
import {
  DefinitionList,
  Disclosure,
  WordDataRow,
  WordFreqStats,
  WordHelp,
  type WordHelpInteraction,
} from "@/components/WordHelp";
import { useWordHelpSettings } from "@/components/WordHelpSettings";
import { cn } from "@/lib/utils";
import {
  cleanGloss,
  formatLexiconMorph,
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
 * morpheme-segment breakdown. Each segment shows its parsing label and gloss;
 * when its disambiguated Strong's number resolves to a TBESH lexicon entry, the
 * row becomes a {@link Disclosure} that expands the terse gloss into the full
 * definition, mirroring the Greek card. Segments TBESH does not cover —
 * punctuation, and the ~0.07% of codes with no entry — keep the plain row.
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
      {segments.map((seg, i) => (
        <SegmentRow
          key={seg.segment_index}
          seg={seg}
          isFirst={i === 0}
          isLast={i === segments.length - 1}
        />
      ))}
    </WordHelp>
  );
}

function SegmentRow({
  seg,
  isFirst,
  isLast,
}: {
  seg: WordSegment;
  isFirst: boolean;
  isLast: boolean;
}) {
  const parsing = formatSegmentParsing(seg);
  const gloss = cleanGloss(seg.gloss);

  const hebrew = (
    <span className="font-hebrew shrink-0" dir="rtl">
      {seg.hebrew}
    </span>
  );
  const parsingGloss = (
    <>
      {parsing}
      {parsing && gloss ? " — " : null}
      {gloss ? <span className="italic">{gloss}</span> : null}
    </>
  );

  // With a lexicon entry the whole segment line becomes the disclosure toggle,
  // so the definition can expand beneath it at the card's full width (rather than
  // indented inside the gloss column, as it would be if only the gloss toggled).
  if (seg.lexicon) {
    const morph = formatLexiconMorph(seg.lexicon.morph);
    return (
      // A touch of space above each segment (bar the first) gives the rows room
      // to breathe when collapsed.
      <WordDataRow className={cn(!isFirst && "mt-1")}>
        <Disclosure
          summary={
            <span className="flex items-baseline gap-2">
              {hebrew}
              <span>{parsingGloss}</span>
            </span>
          }
        >
          {/* English definition prose with inline Hebrew: pin it LTR so the
              surrounding English is not reordered around the Hebrew runs. When a
              later segment follows, add space beneath so the definition does not
              crowd the next segment row (which itself adds a matching mt-1); the
              last segment leaves the gap to the next word's card as-is. */}
          <div dir="ltr" className={cn("mt-1", !isLast && "mb-1")}>
            {/* Headword line: the lexicon's citation lemma, transliteration and
                a BDB-style part-of-speech label. The summary above shows the
                surface morpheme in context, not the dictionary form, so this is
                what gives the entry its lexicon feel. */}
            <p className="font-lexicon text-xs">
              <span className="font-hebrew" dir="rtl">
                {seg.lexicon.hebrew}
              </span>{" "}
              <span className="italic">{seg.lexicon.transliteration}</span>
              {morph ? <span className="italic"> · {morph}</span> : null}
            </p>
            <DefinitionList meanings={[seg.lexicon.meaning]} />
          </div>
        </Disclosure>
      </WordDataRow>
    );
  }

  return (
    <WordDataRow className={cn(!isFirst && "mt-1", "flex items-baseline gap-2")}>
      {hebrew}
      <span className="flex-1">{parsingGloss}</span>
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

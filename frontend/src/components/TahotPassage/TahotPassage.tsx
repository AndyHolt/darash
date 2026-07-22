import type React from "react";
import { PassageLayout, usePassageReader } from "@/components/PassageReader";
import { TahotWordHelp } from "@/components/TahotWordHelp";
import type { WordInteraction } from "@/components/WordHelp";
import { shouldShowHelp } from "@/components/WordHelpSettings";
import {
  layoutPassage,
  type Passage,
  type PoetryLine,
  type Verse,
  type Word as WordData,
  wordDisplayParts,
  wordKey,
} from "@/texts/tahot";
import { PassageAttribution } from "./PassageAttribution";

export interface TahotPassageProps {
  passage: Passage;
}

// A word is an interactive help target only when it carries morphology. Lone
// punctuation (a bare sof-pasuq, or a petuhah/setumah marker) has no parsing or
// gloss to show, so it renders as plain text instead.
function hasMorphology(w: WordData): boolean {
  return w.segments.some((s) => s.kind !== "punctuation");
}

/**
 * The Hebrew OT reading view. Mirrors {@link MorphgntPassage}'s interaction model
 * (hover/pin/reveal via {@link usePassageReader}, the shared {@link PassageLayout}
 * shell) but reads RTL with the help sidebar on the left, and takes its block
 * structure from the colometry layer (`layoutPassage`) rather than a flat
 * paragraph list — prose verses group into paragraphs, poetry verses render as
 * indented stichs.
 */
export function TahotPassage({ passage }: TahotPassageProps) {
  const reader = usePassageReader();

  const renderWord = (w: WordData) => {
    if (!hasMorphology(w)) return <PlainWord key={wordKey(w)} word={w} />;
    const id = wordKey(w);
    return (
      <Word key={id} word={w} registerRef={reader.registerWord(id)} {...reader.interaction(id)} />
    );
  };

  const textBlocks = layoutPassage(passage.verses).map((block) =>
    block.kind === "prose" ? (
      <p key={block.id} className="mb-3 last:mb-0">
        {block.verses.map((verse) => (
          <ProseVerse key={verseKey(verse)} verse={verse} renderWord={renderWord} />
        ))}
      </p>
    ) : (
      <div key={block.id} className="mb-3 last:mb-0">
        {block.lines.map((line) => (
          <PoetryVerse key={verseKey(line.verse)} line={line} renderWord={renderWord} />
        ))}
      </div>
    ),
  );

  const helpList = passage.verses
    .flatMap((v) => v.words)
    .filter(hasMorphology)
    .filter((w) => shouldShowHelp(w, reader.helpSettings) || reader.isRevealed(wordKey(w)))
    .map((w) => {
      const id = wordKey(w);
      return <TahotWordHelp key={id} word={w} {...reader.interaction(id)} />;
    });

  return (
    <PassageLayout
      text={textBlocks}
      help={helpList}
      attribution={<PassageAttribution />}
      textClassName="font-hebrew leading-loose text-lg"
      dir="rtl"
      sidebarSide="left"
    />
  );
}

function verseKey(verse: Verse): string {
  return `${verse.chapter}.${verse.verse}`;
}

// Chapter number at a chapter's first verse, otherwise a verse superscript. The
// margin uses the logical inline-end side so the marker sits before the word in
// both LTR and RTL.
function VerseMarker({ verse }: { verse: Verse }) {
  if (verse.verse === 1) {
    return (
      <span className="me-1 text-primary font-bold font-sans text-base [font-size-adjust:none]">
        {verse.chapter}
      </span>
    );
  }
  return (
    <sup className="me-1 text-muted-foreground font-sans text-xs [font-size-adjust:none]">
      {verse.verse}
    </sup>
  );
}

function ProseVerse({
  verse,
  renderWord,
}: {
  verse: Verse;
  renderWord: (w: WordData) => React.ReactNode;
}) {
  return (
    <>
      <VerseMarker verse={verse} />
      {verse.words.map(renderWord)}
    </>
  );
}

// A poetry verse renders each colon on its own line; continuation cola are
// indented with a logical inline-start padding so the hang nests under RTL.
function PoetryVerse({
  line,
  renderWord,
}: {
  line: PoetryLine;
  renderWord: (w: WordData) => React.ReactNode;
}) {
  return (
    <>
      {line.cola.map((colon, i) => (
        <div key={wordKey(colon[0])} className={i === 0 ? undefined : "ps-6"}>
          {i === 0 && <VerseMarker verse={line.verse} />}
          {colon.map(renderWord)}
        </div>
      ))}
    </>
  );
}

interface WordProps extends WordInteraction {
  word: WordData;
  registerRef: (el: HTMLElement | null) => void;
}

function Word({
  word,
  focused,
  pinned,
  registerRef,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: WordProps) {
  const { text, paragraphMarker, paseq, joinsNext } = wordDisplayParts(word);
  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: every word is a hover/click target for the word help sidebar; making each one a focusable button would create hundreds of tab stops per chapter and break reading flow. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above — keyboard navigation across every word is intentionally not provided; click is supplementary to hover. */}
      <span
        ref={registerRef}
        data-focused={focused ? "true" : undefined}
        data-pinned={pinned ? "true" : undefined}
        className="cursor-pointer rounded-sm data-[focused=true]:bg-muted data-[focused=true]:text-primary data-[pinned=true]:not-data-[focused=true]:bg-accent"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {text}
      </span>
      <Paseq paseq={paseq} />
      {joinsNext ? null : " "}
      <ParagraphMarker marker={paragraphMarker} />
    </>
  );
}

function PlainWord({ word }: { word: WordData }) {
  const { text, paragraphMarker, paseq, joinsNext } = wordDisplayParts(word);
  return (
    <>
      {text ? <span>{text}</span> : null}
      <Paseq paseq={paseq} />
      {text && !joinsNext ? " " : null}
      <ParagraphMarker marker={paragraphMarker} />
    </>
  );
}

// The petuhah/setumah paragraph-division marker, shown inline between words and
// set apart with a horizontal margin on each side. Non-selectable, since it is
// editorial structure rather than text. Renders nothing for the common word
// that carries no marker.
function ParagraphMarker({ marker }: { marker?: string }) {
  if (!marker) return null;
  return <span className="mx-2 text-sm text-muted-foreground select-none">{marker}</span>;
}

// The paseq word-divider, set apart with a space on each side. The leading space
// is rendered here; the trailing one is the word's normal inter-word space. It
// sits outside the word's hover target, since the divider belongs to neither
// neighbour, and renders nothing for the common no-paseq case.
function Paseq({ paseq }: { paseq?: string }) {
  if (!paseq) return null;
  return (
    <>
      {" "}
      <span className="select-none">{paseq}</span>
    </>
  );
}

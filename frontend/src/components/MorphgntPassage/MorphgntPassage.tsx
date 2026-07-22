import { MorphgntWordHelp } from "@/components/MorphgntWordHelp";
import { PassageLayout, usePassageReader, VerseMarker } from "@/components/PassageReader";
import type { WordInteraction } from "@/components/WordHelp";
import { shouldShowHelp } from "@/components/WordHelpSettings";
import { type Passage, type Word as WordData, wordKey } from "@/texts/morphgnt";
import { PassageAttribution } from "./PassageAttribution";

export interface MorphgntPassageProps {
  passage: Passage;
}

export function MorphgntPassage({ passage }: MorphgntPassageProps) {
  const reader = usePassageReader();

  const renderWord = (w: WordData) => {
    const id = wordKey(w);
    return (
      <Word key={id} word={w} registerRef={reader.registerWord(id)} {...reader.interaction(id)} />
    );
  };

  const paragraphList = passage.paragraphs.map((p) => (
    <p key={p.id} className="mb-3 last:mb-0">
      {p.words.map(renderWord)}
    </p>
  ));

  const helpList = passage.paragraphs
    .flatMap((p) => p.words)
    .filter((w) => shouldShowHelp(w, reader.helpSettings) || reader.isRevealed(wordKey(w)))
    .map((w) => {
      const id = wordKey(w);
      return <MorphgntWordHelp key={id} word={w} {...reader.interaction(id)} />;
    });

  return (
    <PassageLayout
      text={paragraphList}
      help={helpList}
      attribution={<PassageAttribution />}
      textClassName="font-greek leading-7"
    />
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
  return (
    <>
      {word.word_index === 1 && <VerseMarker chapter={word.chapter} verse={word.verse} />}
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
        {word.text}
      </span>{" "}
    </>
  );
}

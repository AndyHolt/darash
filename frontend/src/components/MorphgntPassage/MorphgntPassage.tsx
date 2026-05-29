import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { WordHelp } from "@/components/WordHelp/WordHelp";
import { shouldShowHelp, useWordHelpSettings } from "@/components/WordHelpSettings/state";
import { useMediaQuery } from "@/hooks/use-media-query";
import { type Passage, type Word as WordData, wordKey } from "@/texts/morphgnt";

export interface MorphgntPassageProps {
  passage: Passage;
}

export function MorphgntPassage({ passage }: MorphgntPassageProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  // Help for common words is hidden by default to keep the sidebar focused on
  // vocabulary the reader is unlikely to know. Clicking such a word reveals its
  // help for the rest of the session even if the threshold would exclude it.
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [helpSettings] = useWordHelpSettings();
  const focusedId = hoveredId ?? pinnedId;

  const handleWordClick = (id: string) => {
    setPinnedId((curr) => (curr === id ? null : id));
    setRevealedIds((curr) => {
      if (curr.has(id)) return curr;
      const next = new Set(curr);
      next.add(id);
      return next;
    });
  };

  const wordRefs = useRef(new Map<string, HTMLSpanElement>());

  // Matches Tailwind's md breakpoint. Wide → sidebar with page scroll.
  // Narrow → vertical resizable split (text on top, word help below).
  const isWide = useMediaQuery("(min-width: 768px)");

  // Reset window scroll when this component mounts. The component is keyed by
  // passageRef in the route, so navigating to a new passage remounts it; window
  // scroll lives outside React's tree and would otherwise persist from the
  // previous passage. If a flash of mid-scroll content is ever observed on
  // navigation, switch to useLayoutEffect to run before paint.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Scroll the pinned word into view in the main text panel. Fires when a
  // user clicks a sidebar help item for an off-screen word; clicking a word
  // already on screen is a no-op because of `block: "nearest"`. As above,
  // useLayoutEffect would eliminate any visible scroll lag if it ever shows.
  useEffect(() => {
    if (!pinnedId) return;
    wordRefs.current.get(pinnedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pinnedId]);

  // When the help settings change, the click-driven reveal/pin state becomes
  // stale (a pinned word may no longer pass the new threshold, and previously
  // revealed words shouldn't carry forward). Clear both so the sidebar
  // reflects the new threshold immediately.
  // biome-ignore lint/correctness/useExhaustiveDependencies: helpSettings is intentionally a change trigger; the effect body uses only stable setters.
  useEffect(() => {
    setRevealedIds((prev) => (prev.size === 0 ? prev : new Set()));
    setPinnedId((prev) => (prev === null ? prev : null));
  }, [helpSettings]);

  const renderWord = (w: WordData) => {
    const id = wordKey(w);
    return (
      <Word
        key={id}
        word={w}
        focused={focusedId === id}
        pinned={pinnedId === id}
        registerRef={(el) => {
          if (el) wordRefs.current.set(id, el);
          else wordRefs.current.delete(id);
        }}
        onMouseEnter={() => setHoveredId(id)}
        onMouseLeave={() => setHoveredId((curr) => (curr === id ? null : curr))}
        onClick={() => handleWordClick(id)}
      />
    );
  };

  const paragraphList = passage.paragraphs.map((p) => (
    <p key={p.id} className="mb-3 last:mb-0">
      {p.words.map(renderWord)}
    </p>
  ));

  const helpList = passage.paragraphs
    .flatMap((p) => p.words)
    .filter((w) => shouldShowHelp(w, helpSettings) || revealedIds.has(wordKey(w)))
    .map((w) => {
      const id = wordKey(w);
      return (
        <WordHelp
          key={id}
          word={w}
          focused={focusedId === id}
          pinned={pinnedId === id}
          onMouseEnter={() => setHoveredId(id)}
          onMouseLeave={() => setHoveredId((curr) => (curr === id ? null : curr))}
          onClick={() => handleWordClick(id)}
        />
      );
    });

  if (isWide) {
    return (
      <div className="my-2 mx-4 flex flex-row justify-center gap-x-16 items-start">
        <div className="max-w-lg">
          <div className="font-greek leading-7">{paragraphList}</div>
        </div>
        <aside className="max-w-sm sticky top-16 max-h-[calc(100dvh-3rem)] overflow-y-auto bg-sidebar text-sidebar-foreground my-2 py-2 px-4 border border-border rounded-md">
          {helpList}
        </aside>
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="vertical" className="h-full">
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="h-full overflow-y-auto">
          {/* min-h-full + flex-col pins the footer to the bottom of the
              panel when the text is short, and reveals it after the text
              when the text overflows. */}
          <div className="min-h-full flex flex-col">
            <div className="font-greek leading-7 px-4 py-2 flex-1">{paragraphList}</div>
            <Footer />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={15}>
        <div className="h-full overflow-y-auto bg-sidebar text-sidebar-foreground py-2 px-4">
          {helpList}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

interface WordProps {
  word: WordData;
  focused: boolean;
  pinned: boolean;
  registerRef: (el: HTMLSpanElement | null) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
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
      {word.verse === 1 && word.word_index === 1 && (
        <span className="mr-1 text-primary font-bold font-sans text-base">{word.chapter}</span>
      )}
      {word.word_index === 1 && word.verse !== 1 && (
        <sup className="mr-1 text-muted-foreground font-sans text-xs">{word.verse}</sup>
      )}
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

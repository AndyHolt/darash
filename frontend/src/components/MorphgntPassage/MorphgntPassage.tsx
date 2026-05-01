import { Fragment, useEffect, useRef, useState } from "react";
import { ParsingCard } from "@/components/ParsingCard/ParsingCard";
import { type Passage, wordKey } from "@/texts/morphgnt";

export interface MorphgntPassageProps {
  passage: Passage;
}

export function MorphgntPassage({ passage }: MorphgntPassageProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const focusedId = hoveredId ?? pinnedId;

  const wordRefs = useRef(new Map<string, HTMLSpanElement>());

  // Reset window scroll when this component mounts. The component is keyed by
  // passageRef in the route, so navigating to a new passage remounts it; window
  // scroll lives outside React's tree and would otherwise persist from the
  // previous passage. If a flash of mid-scroll content is ever observed on
  // navigation, switch to useLayoutEffect to run before paint.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Scroll the pinned word into view in the main text panel. Fires when a
  // user clicks a sidebar card for an off-screen word; clicking a word
  // already on screen is a no-op because of `block: "nearest"`. As above,
  // useLayoutEffect would eliminate any visible scroll lag if it ever shows.
  useEffect(() => {
    if (!pinnedId) return;
    wordRefs.current.get(pinnedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pinnedId]);

  return (
    <div className="my-2 mx-4 flex flex-row justify-center gap-x-16 items-start">
      <div className="max-w-lg">
        <div className="font-greek leading-7">
          {passage.words.map((w) => {
            const id = wordKey(w);
            return (
              <Fragment key={id}>
                {w.verse === 1 && w.word_index === 1 && (
                  <span className="mr-1 text-primary font-bold font-sans text-base">
                    {w.chapter}
                  </span>
                )}
                {w.word_index === 1 && w.verse !== 1 && (
                  <sup className="mr-1 text-muted-foreground font-sans text-xs">{w.verse}</sup>
                )}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: every word is a hover/click target for the parsing sidebar; making each one a focusable button would create hundreds of tab stops per chapter and break reading flow. */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: see above — keyboard navigation across every word is intentionally not provided; click is supplementary to hover. */}
                <span
                  ref={(el) => {
                    if (el) wordRefs.current.set(id, el);
                    else wordRefs.current.delete(id);
                  }}
                  data-focused={focusedId === id ? "true" : undefined}
                  data-pinned={pinnedId === id ? "true" : undefined}
                  className="cursor-pointer rounded-sm data-[focused=true]:bg-muted data-[focused=true]:text-primary data-[pinned=true]:not-data-[focused=true]:bg-accent"
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId((curr) => (curr === id ? null : curr))}
                  onClick={() => setPinnedId((curr) => (curr === id ? null : id))}
                >
                  {w.text}
                </span>{" "}
              </Fragment>
            );
          })}
        </div>
      </div>
      <aside className="hidden md:block max-w-sm sticky top-2 max-h-dvh overflow-y-auto bg-sidebar text-sidebar-foreground my-2 py-2 px-4 border border-border rounded-md">
        {passage.words.map((w) => {
          const id = wordKey(w);
          return (
            <ParsingCard
              key={id}
              word={w}
              focused={focusedId === id}
              pinned={pinnedId === id}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId((curr) => (curr === id ? null : curr))}
              onClick={() => setPinnedId((curr) => (curr === id ? null : id))}
            />
          );
        })}
      </aside>
    </div>
  );
}

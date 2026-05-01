import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { ParsingCard } from "@/components/ParsingCard/ParsingCard";
import { passageQuery, wordKey } from "@/texts/morphgnt";

export const Route = createFileRoute("/sblgnt/$passageRef")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(passageQuery(params.passageRef)),
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  component: RouteComponent,
});

function RouteComponent() {
  const { passageRef } = Route.useParams();
  const { data: passage } = useSuspenseQuery(passageQuery(passageRef));

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const focusedId = hoveredId ?? pinnedId;

  useEffect(() => {
    if (!pinnedId) return;
    const el = document.querySelector(`[data-word-id="${pinnedId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
                  data-word-id={id}
                  data-focused={focusedId === id ? "true" : undefined}
                  data-pinned={pinnedId === id ? "true" : undefined}
                  className="cursor-pointer rounded-sm data-[focused=true]:bg-muted data-[pinned=true]:bg-accent data-[focused=true]:text-primary data-[pinned=true]:text-primary"
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

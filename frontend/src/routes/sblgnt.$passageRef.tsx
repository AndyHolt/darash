import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { ParsingCard } from "@/components/ParsingCard/ParsingCard";
import { passageQuery, type Word } from "@/texts/morphgnt";

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

  return (
    <div className="my-2 mx-4 flex flex-row justify-center gap-x-16">
      <div className="max-w-lg">
        <div className="font-greek text-lg">
          {passage.words.map((w) => (
            <Fragment key={wordKey(w)}>
              {w.verse === 1 && w.word_index === 1 && (
                <span className="mr-1 text-primary font-bold font-sans text-base">{w.chapter}</span>
              )}
              {w.word_index === 1 && w.verse !== 1 && (
                <sup className="mr-1 text-muted-foreground font-sans text-xs">{w.verse}</sup>
              )}
              <span>{w.text} </span>
            </Fragment>
          ))}
        </div>
      </div>
      <aside className="hidden md:inline max-w-sm bg-sidebar color-sidebar-foreground py-2 px-4 border border-border rounded-md">
        {passage.words.map((w) => (
          <ParsingCard key={`${w.book}.${w.chapter}.${w.verse}.${w.word_index}`} word={w} />
        ))}
      </aside>
    </div>
  );
}

function wordKey(w: Word): string {
  return `${w.book}.${w.chapter}.${w.verse}.${w.word_index}`;
}

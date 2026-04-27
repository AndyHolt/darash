import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Passage, Word } from "@/texts/morphgnt/morphgnt.types";

const passageQuery = (ref: string) =>
  queryOptions({
    queryKey: ["morphgntPassage", ref],
    queryFn: ({ signal }) =>
      fetch(`/api/morphgnt/passage/${ref}`, { signal }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Passage>;
      }),
  });

export const Route = createFileRoute("/sblgnt/$passageRef")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(passageQuery(params.passageRef)),
  pendingComponent: () => <div>oading...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  component: RouteComponent,
});

function RouteComponent() {
  const { passageRef } = Route.useParams();
  const { data: passage } = useSuspenseQuery(passageQuery(passageRef));

  return (
    <div>
      {passage.words.map((w) => (
        <span key={wordKey(w)}>{w.text} </span>
      ))}
    </div>
  );
}

function wordKey(w: Word): string {
  return `${w.book}.${w.chapter}.${w.verse}${w.word_index}`;
}

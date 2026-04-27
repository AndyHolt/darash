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
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  component: RouteComponent,
});

function RouteComponent() {
  const { passageRef } = Route.useParams();
  const { data: passage } = useSuspenseQuery(passageQuery(passageRef));

  return (
    <div className="my-2 mx-4 flex flex-row justify-center">
      <div className="max-w-lg">
        <div>
          {passage.words.map((w) => (
            <>
              {w.verse === 1 && w.word_index === 1 && (
                <span className="mr-1 text-primary font-bold">{w.chapter}</span>
              )}
              {w.word_index === 1 && w.verse !== 1 && (
                <sup className="mr-1 text-muted-foreground">{w.verse}</sup>
              )}
              <span key={wordKey(w)} className="font-greek text-lg">
                {w.text}{" "}
              </span>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

function wordKey(w: Word): string {
  return `${w.book}.${w.chapter}.${w.verse}.${w.word_index}`;
}

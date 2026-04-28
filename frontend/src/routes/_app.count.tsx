import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

interface WordCount {
  count: number;
}

const countQueryOptions = queryOptions({
  queryKey: ["count"],
  queryFn: ({ signal }) =>
    fetch(`/api/count`, { signal }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<WordCount>;
    }),
});

export const Route = createFileRoute("/_app/count")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(countQueryOptions),
  component: () => {
    const {
      data: { count },
    } = useSuspenseQuery(countQueryOptions);

    return <div>Word count: {count}</div>;
  },
});

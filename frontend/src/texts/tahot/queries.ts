import { queryOptions } from "@tanstack/react-query";
import { HttpError } from "@/lib/http-error";
import type { Passage } from "./tahot.types";

export const tahotQueryKeys = {
  all: ["tahot"] as const,
  passages: () => [...tahotQueryKeys.all, "passage"] as const,
  passage: (ref: string) => [...tahotQueryKeys.passages(), ref] as const,
};

export function passageQuery(ref: string) {
  return queryOptions({
    queryKey: tahotQueryKeys.passage(ref),
    // Deliberately not consuming the request signal — see the matching note in
    // texts/morphgnt/queries.ts: a fetched passage is always worth completing
    // and caching even if every observer has gone away.
    queryFn: () =>
      fetch(`/api/tahot/passage/${ref}`).then((res) => {
        if (!res.ok) throw new HttpError(res.status, res.statusText);
        return res.json() as Promise<Passage>;
      }),
  });
}

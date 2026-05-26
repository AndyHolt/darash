import { queryOptions } from "@tanstack/react-query";
import { HttpError } from "@/lib/http-error";
import type { Passage } from "./morphgnt.types";

export const passageQueryKeyPrefix = ["morphgntPassage"] as const;

export const morphgntQueryKeys = {
  all: ["morphgnt"] as const,
  passages: () => [...morphgntQueryKeys.all, "passage"] as const,
  passage: (ref: string) => [...morphgntQueryKeys.passages(), ref] as const,
};

export function passageQuery(ref: string) {
  return queryOptions({
    queryKey: morphgntQueryKeys.passage(ref),
    // Deliberately not consuming the request signal: a fetched passage is
    // always worth completing and caching even if every observer has gone
    // away, so the next read of the same ref within gcTime hits warm
    // cache. As a side benefit this avoids React Query's CancelledError
    // path on a slow initial load, where StrictMode's mount/cleanup/mount
    // cycle on PassagePicker briefly empties the observer set.
    queryFn: () =>
      fetch(`/api/morphgnt/passage/${ref}`).then((res) => {
        if (!res.ok) throw new HttpError(res.status, res.statusText);
        return res.json() as Promise<Passage>;
      }),
  });
}

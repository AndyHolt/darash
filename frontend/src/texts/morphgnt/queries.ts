import { queryOptions } from "@tanstack/react-query";
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
    queryFn: ({ signal }) =>
      fetch(`/api/morphgnt/passage/${ref}`, { signal }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Passage>;
      }),
  });
}

import { queryOptions } from "@tanstack/react-query";
import type { Passage } from "./morphgnt.types";

export function passageQuery(ref: string) {
  return queryOptions({
    queryKey: ["morphgntPassage", ref],
    queryFn: ({ signal }) =>
      fetch(`/api/morphgnt/passage/${ref}`, { signal }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Passage>;
      }),
  });
}

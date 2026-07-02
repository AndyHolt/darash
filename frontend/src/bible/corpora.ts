import { DEFAULT_PASSAGE_REF } from "@/texts/morphgnt";
import { DEFAULT_TAHOT_PASSAGE_REF } from "@/texts/tahot";
import type { BookInfo } from "./books";
import { NT_BOOKS, OT_BOOKS } from "./books";

// A corpus is a top-level text-family the reader exposes (the picker's first
// choice). It aligns 1:1 with a testament today, but the concept is broader:
// the destination route is owned by the corpus, not inferred from the book —
// so a future LXX (Greek text over OT books) is one more entry here rather than
// a special case in the routing.
export type CorpusId = "hebrew-bible" | "greek-nt";

// The reader route for a corpus, in the literal-union shape TanStack Router's
// <Link to> expects. Both corpora's routes share the `$passageRef` param.
export type CorpusRoute = "/tahot/$passageRef" | "/sblgnt/$passageRef";

export interface Corpus {
  id: CorpusId;
  label: string;
  books: readonly BookInfo[];
  route: CorpusRoute;
  // The passage the reader falls back to for this corpus (default landing spot,
  // "go to default" recovery button). A URL ref tag, e.g. "gen.1.1-gen.1.31".
  defaultPassageRef: string;
}

export const CORPORA = {
  "hebrew-bible": {
    id: "hebrew-bible",
    label: "Hebrew Bible",
    books: OT_BOOKS,
    route: "/tahot/$passageRef",
    defaultPassageRef: DEFAULT_TAHOT_PASSAGE_REF,
  },
  "greek-nt": {
    id: "greek-nt",
    label: "Greek New Testament",
    books: NT_BOOKS,
    route: "/sblgnt/$passageRef",
    defaultPassageRef: DEFAULT_PASSAGE_REF,
  },
} as const satisfies Record<CorpusId, Corpus>;

// Display order for the picker's corpus tabs.
export const CORPUS_LIST = [CORPORA["hebrew-bible"], CORPORA["greek-nt"]] as const;

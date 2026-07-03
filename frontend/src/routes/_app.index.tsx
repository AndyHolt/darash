import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_CORPUS } from "@/bible/corpora";

// The site root implies no corpus, so it lands on the default corpus's default
// passage. Routed through DEFAULT_CORPUS rather than either text module so no
// corpus is the unmarked default.
export const Route = createFileRoute("/_app/")({
  beforeLoad: () => {
    throw redirect({
      to: DEFAULT_CORPUS.route,
      params: { passageRef: DEFAULT_CORPUS.defaultPassageRef },
      replace: true,
    });
  },
});

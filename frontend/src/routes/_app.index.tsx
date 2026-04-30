import { createFileRoute, redirect } from "@tanstack/react-router";

const DEFAULT_PASSAGE = "john.1.1-john.1.18";

export const Route = createFileRoute("/_app/")({
  beforeLoad: () => {
    throw redirect({
      to: "/sblgnt/$passageRef",
      params: { passageRef: DEFAULT_PASSAGE },
      replace: true,
    });
  },
});

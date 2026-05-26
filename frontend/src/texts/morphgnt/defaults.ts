import { redirect } from "@tanstack/react-router";

export const DEFAULT_PASSAGE_REF = "john.1.1-john.1.18";

export function redirectToDefaultPassage(): never {
  throw redirect({
    to: "/sblgnt/$passageRef",
    params: { passageRef: DEFAULT_PASSAGE_REF },
    replace: true,
  });
}

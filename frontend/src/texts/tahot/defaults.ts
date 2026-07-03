import { redirect } from "@tanstack/react-router";

export const DEFAULT_PASSAGE_REF = "gen.1.1-gen.1.31";

export function redirectToDefaultPassage(): never {
  throw redirect({
    to: "/tahot/$passageRef",
    params: { passageRef: DEFAULT_PASSAGE_REF },
    replace: true,
  });
}

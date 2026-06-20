import type { Gender, GrammaticalNumber, Person, State, TahotSegment } from "./tahot.types";

const PERSON: Record<Person, string> = {
  first: "1",
  second: "2",
  third: "3",
};

const GENDER: Record<Gender, string> = {
  masculine: "m",
  feminine: "f",
  common: "c",
  both: "b",
};

const NUMBER: Record<GrammaticalNumber, string> = {
  singular: "s",
  plural: "p",
  dual: "d",
};

const STATE: Record<State, string> = {
  absolute: "abs",
  construct: "cstr",
  determined: "det",
};

function capitalize(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

function joinTight(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join("");
}

function joinSpaces(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

// Person-gender-number, e.g. "3ms" for a finite verb or pronominal suffix.
function personGenderNumber(seg: TahotSegment): string {
  return joinTight(
    seg.person && PERSON[seg.person],
    seg.gender && GENDER[seg.gender],
    seg.number && NUMBER[seg.number],
  );
}

// Gender-number (+ state), e.g. "fs cstr" for a noun in construct.
function genderNumberState(seg: TahotSegment): string {
  const gn = joinTight(seg.gender && GENDER[seg.gender], seg.number && NUMBER[seg.number]);
  return joinSpaces(gn, seg.state && STATE[seg.state]);
}

/**
 * A compact parsing label for one morpheme segment, e.g. "Qal perfect 3ms",
 * "Noun fs cstr", "Preposition". Returns "" for punctuation (no morphology).
 */
export function formatSegmentParsing(seg: TahotSegment): string {
  if (seg.kind === "punctuation" || !seg.part_of_speech) return "";

  if (seg.part_of_speech === "verb") {
    const label = capitalize(seg.verb_stem ?? "verb");
    const code = joinSpaces(seg.verb_type, personGenderNumber(seg));
    return code ? `${label} ${code}` : label;
  }

  const label = capitalize(seg.part_of_speech);
  // Pronouns and pronominal suffixes carry person; nominals carry state.
  const code = seg.person && !seg.state ? personGenderNumber(seg) : genderNumberState(seg);
  return code ? `${label} ${code}` : label;
}

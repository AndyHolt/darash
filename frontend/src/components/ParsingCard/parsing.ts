import type {
  Case,
  Degree,
  Gender,
  GrammaticalNumber,
  Mood,
  Person,
  Tense,
  Voice,
  Word,
} from "@/texts/morphgnt";

const TENSE: Record<Tense, string> = {
  present: "Pres",
  imperfect: "Impf",
  future: "Fut",
  aorist: "Aor",
  perfect: "Perf",
  pluperfect: "Plup",
};

const VOICE: Record<Voice, string> = {
  active: "Act",
  middle: "Mid",
  passive: "Pass",
};

const FINITE_MOOD: Partial<Record<Mood, string>> = {
  indicative: "Ind",
  imperative: "Impv",
  subjunctive: "Subj",
  optative: "Opt",
};

const CASE: Record<Case, string> = {
  nominative: "N",
  genitive: "G",
  dative: "D",
  accusative: "A",
  vocative: "V",
};

const GENDER: Record<Gender, string> = {
  masculine: "M",
  feminine: "F",
  neuter: "N",
};

const NUMBER: Record<GrammaticalNumber, string> = {
  singular: "S",
  plural: "P",
};

const PERSON: Record<Person, string> = {
  first: "1",
  second: "2",
  third: "3",
};

const DEGREE: Record<Degree, string> = {
  comparative: "Comp",
  superlative: "Sup",
};

function caseGenderNumber(word: Word): string {
  return [
    word.case && CASE[word.case],
    word.gender && GENDER[word.gender],
    word.number && NUMBER[word.number],
  ]
    .filter(Boolean)
    .join("");
}

function personNumber(word: Word): string {
  return [word.person && PERSON[word.person], word.number && NUMBER[word.number]]
    .filter(Boolean)
    .join("");
}

function joinSpaces(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ");
}

function formatLabel(word: Word): string {
  if (word.part_of_speech === "verb") {
    if (word.mood === "participle") return "Participle";
    if (word.mood === "infinitive") return "Infinitive";
    return "Finite verb";
  }
  const pos = word.part_of_speech;
  return pos[0].toUpperCase() + pos.slice(1);
}

function formatCode(word: Word): string {
  switch (word.part_of_speech) {
    case "adjective":
      return joinSpaces(caseGenderNumber(word), word.degree && DEGREE[word.degree]);

    case "verb": {
      const tv = joinSpaces(word.tense && TENSE[word.tense], word.voice && VOICE[word.voice]);
      if (word.mood === "infinitive") return joinSpaces(tv, "Inf");
      if (word.mood === "participle") return joinSpaces(tv, "Ptc", caseGenderNumber(word));
      return joinSpaces(tv, word.mood && FINITE_MOOD[word.mood], personNumber(word));
    }

    case "noun":
    case "article":
    case "demonstrative pronoun":
    case "interrogative/indefinite pronoun":
    case "relative pronoun":
      return caseGenderNumber(word);

    case "personal pronoun":
      return joinSpaces(word.person && PERSON[word.person], caseGenderNumber(word));

    case "conjunction":
    case "adverb":
    case "preposition":
    case "particle":
    case "interjection":
      return "";

    default: {
      const exhaustive: never = word.part_of_speech;
      throw new Error("Unexpected part of speech:", exhaustive);
    }
  }
}

export function formatParsing(word: Word): string {
  const label = formatLabel(word);
  const code = formatCode(word);
  return code ? `${label}: ${code}` : label;
}

// Decodes the STEPBible morphology code carried on a TBESH lexicon entry (e.g.
// "H:N-M", "N:N--L", "A:V") into a short BDB-style part-of-speech label ("n.m.",
// "n.pr.loc.", "Aramaic vb.") for the entry's headword line.
//
// The code is `{scope}:{pos}[-{feature}...]`. Scope is H (Hebrew), A (Aramaic)
// or N (proper noun). The hyphen-separated tail carries gender (M / F / C, or
// "M/F" for either) and, for proper nouns, a name type: P (person), L
// (location), a trailing G (gentilic/demonym), or T (other, e.g. month names).
// Alternatives are separated by " / " and compounds by "+".
//
// Structural tokens with no colon — Prefix, Suffix, Punct., and the
// pronominal-suffix codes (Ss3m, Pp1c, …) — carry no lexical part of speech and
// decode to nothing, so those entries show no morph label at all.

const GENDER_ABBR: Record<string, string> = {
  M: "m.",
  F: "f.",
  C: "c.",
  "M/F": "m./f.",
};

// Non-noun parts of speech. Nouns (common and proper) and adjectives are handled
// separately because they take a gender suffix.
const POS_ABBR: Record<string, string> = {
  V: "vb.",
  Adv: "adv.",
  Prep: "prep.",
  Conj: "conj.",
  Intj: "interj.",
  Intg: "interrog.",
  Cond: "cond.",
  Neg: "neg.",
  Part: "part.",
  DemP: "dem.pron.",
  RelP: "rel.pron.",
  PerP: "pers.pron.",
  IndP: "indef.pron.",
};

// The proper-noun name type: gentilic (any code ending in G) or location; a
// person (P) is left to the gender suffix and "other" (T) gets no marker.
function properNounType(code: string | undefined): string {
  if (!code) return "";
  if (code.endsWith("G")) return "gent.";
  if (code === "L") return "loc.";
  return "";
}

function decodeAtom(atom: string): string | undefined {
  const colon = atom.indexOf(":");
  if (colon === -1) return undefined; // structural token — no lexical POS
  const scope = atom.slice(0, colon);
  const features = atom.slice(colon + 1).split("-");
  const pos = features[0];
  const aramaic = scope === "A" ? "Aramaic " : "";

  if (scope === "N") {
    // Proper noun: n.pr. + gender (person names) + name type (loc./gent.).
    return `n.pr.${GENDER_ABBR[features[1]] ?? ""}${properNounType(features[2])}`;
  }
  if (pos === "N") return `${aramaic}n.${GENDER_ABBR[features[1]] ?? ""}`;
  if (pos === "A") return `${aramaic}adj.${GENDER_ABBR[features[1]] ?? ""}`;

  const abbr = POS_ABBR[pos];
  return abbr ? `${aramaic}${abbr}` : undefined;
}

/**
 * A short lexicon part-of-speech label for a TBESH entry's morph code, or
 * undefined when the code carries no lexical part of speech (prefixes, suffixes,
 * punctuation).
 */
export function formatLexiconMorph(morph: string): string | undefined {
  const alternatives = morph
    .split(" / ")
    .map((alt) =>
      alt
        .split("+")
        .map(decodeAtom)
        .filter((atom): atom is string => atom !== undefined)
        .join(" + "),
    )
    .filter((alt) => alt.length > 0);
  return alternatives.length > 0 ? alternatives.join(" / ") : undefined;
}

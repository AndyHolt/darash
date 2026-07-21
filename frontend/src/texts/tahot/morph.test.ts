import { describe, expect, test } from "vitest";
import { formatLexiconMorph } from "./morph";

describe("formatLexiconMorph", () => {
  test("common nouns carry gender", () => {
    expect(formatLexiconMorph("H:N-M")).toBe("n.m.");
    expect(formatLexiconMorph("H:N-F")).toBe("n.f.");
    expect(formatLexiconMorph("H:N")).toBe("n.");
    expect(formatLexiconMorph("H:N-M/F")).toBe("n.m./f.");
  });

  test("verbs and adjectives", () => {
    expect(formatLexiconMorph("H:V")).toBe("vb.");
    expect(formatLexiconMorph("H:A")).toBe("adj.");
    expect(formatLexiconMorph("H:A-F")).toBe("adj.f.");
  });

  test("proper nouns: person, location, gentilic, other", () => {
    expect(formatLexiconMorph("N:N-M-P")).toBe("n.pr.m.");
    expect(formatLexiconMorph("N:N-F-P")).toBe("n.pr.f.");
    expect(formatLexiconMorph("N:N--L")).toBe("n.pr.loc.");
    expect(formatLexiconMorph("N:N--PG")).toBe("n.pr.gent.");
    expect(formatLexiconMorph("N:N--T")).toBe("n.pr.");
  });

  test("Aramaic scope is named", () => {
    expect(formatLexiconMorph("A:N-M")).toBe("Aramaic n.m.");
    expect(formatLexiconMorph("A:V")).toBe("Aramaic vb.");
  });

  test("pronouns and particles", () => {
    expect(formatLexiconMorph("H:PerP-CS")).toBe("pers.pron.");
    expect(formatLexiconMorph("H:DemP")).toBe("dem.pron.");
    expect(formatLexiconMorph("H:Prep")).toBe("prep.");
    expect(formatLexiconMorph("H:Conj")).toBe("conj.");
  });

  test("alternatives and compounds", () => {
    expect(formatLexiconMorph("H:N-M / H:Adv")).toBe("n.m. / adv.");
    expect(formatLexiconMorph("H:Prep+H:RelP")).toBe("prep. + rel.pron.");
  });

  test("structural codes have no lexical POS", () => {
    expect(formatLexiconMorph("Prefix")).toBeUndefined();
    expect(formatLexiconMorph("Suffix")).toBeUndefined();
    expect(formatLexiconMorph("Punct.")).toBeUndefined();
    expect(formatLexiconMorph("Ss3m")).toBeUndefined();
  });
});

import type { Word } from "@/texts/morphgnt";

export function glossesOf(word: Word): string[] {
  return Array.from(new Set(word.lexicon.map((l) => l.gloss)));
}

export function formatGloss(word: Word): string {
  return glossesOf(word).join(" / ");
}

import type { Word } from "./morphgnt.types";

/**
 * The distinct meanings worth showing for a word, deduped. A morphgnt word can
 * carry several TBESG entries — the lexicon's form index fans out across
 * homographs — and they often repeat the same definition.
 */
export function meaningsOf(word: Word): string[] {
  return Array.from(new Set(word.lexicon.map((l) => l.meaning)));
}

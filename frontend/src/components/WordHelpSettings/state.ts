import { useSyncExternalStore } from "react";
import type { Word } from "@/texts/morphgnt";

// The array is the single source of truth for the mode set: the type is
// derived from it, and the runtime validator reads from it. Adding a mode is
// one edit here and the type, type guard, and any iteration stay in sync.
export const WORD_HELP_MODES = ["occurrences", "rank"] as const;
export type WordHelpMode = (typeof WORD_HELP_MODES)[number];

function isWordHelpMode(v: unknown): v is WordHelpMode {
  return typeof v === "string" && (WORD_HELP_MODES as readonly string[]).includes(v);
}

// Both thresholds live on the object regardless of `mode` (rather than a
// discriminated union) so that toggling between modes preserves the user's
// last chosen value for each.
export interface WordHelpSettings {
  mode: WordHelpMode;
  // Show help for lemmas occurring at most this many times in the NT.
  // Use Number.POSITIVE_INFINITY to mean "show help for every word".
  occurrencesThreshold: number;
  // Show help for lemmas ranked strictly higher than this (rank 1 = most common).
  // Use 0 to mean "show help for every word".
  rankThreshold: number;
}

export const OCCURRENCE_PRESETS: readonly number[] = [5, 10, 20, 50, 100, Number.POSITIVE_INFINITY];

export const RANK_PRESETS: readonly number[] = [100, 250, 500, 1000, 0];

export const DEFAULT_SETTINGS: WordHelpSettings = {
  mode: "occurrences",
  occurrencesThreshold: 10,
  rankThreshold: 500,
};

const STORAGE_KEY = "darash.word-help-settings.v1";

export function shouldShowHelp(word: Word, settings: WordHelpSettings): boolean {
  switch (settings.mode) {
    case "occurrences":
      return word.lemma_count <= settings.occurrencesThreshold;
    case "rank":
      return word.lemma_rank > settings.rankThreshold;
    default: {
      const _exhaustive: never = settings.mode;
      throw new Error(`Unhandled WordHelpMode: ${_exhaustive}`);
    }
  }
}

function coerceThreshold(v: unknown, fallback: number): number {
  if (v === "Infinity") return Number.POSITIVE_INFINITY;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function readStored(): WordHelpSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<WordHelpSettings>;
    return {
      mode: isWordHelpMode(parsed.mode) ? parsed.mode : DEFAULT_SETTINGS.mode,
      occurrencesThreshold: coerceThreshold(
        parsed.occurrencesThreshold,
        DEFAULT_SETTINGS.occurrencesThreshold,
      ),
      rankThreshold: coerceThreshold(parsed.rankThreshold, DEFAULT_SETTINGS.rankThreshold),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Single shared store so every consumer (the menu, the passage view, future
// consumers) sees the same object reference. Without this, each useState
// instance would diverge and changes from the menu wouldn't propagate to the
// passage's filter until the route remounted.
let currentSettings: WordHelpSettings = readStored();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): WordHelpSettings {
  return currentSettings;
}

function persist(next: WordHelpSettings): void {
  try {
    // JSON.stringify converts Infinity → null; replace with a sentinel string
    // that readStored knows how to coerce back to Infinity.
    const payload = JSON.stringify(next, (_, v) =>
      v === Number.POSITIVE_INFINITY ? "Infinity" : v,
    );
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // ignore quota / private-mode failures
  }
}

function setSettings(next: WordHelpSettings): void {
  currentSettings = next;
  persist(next);
  for (const listener of listeners) listener();
}

export function useWordHelpSettings(): [WordHelpSettings, (next: WordHelpSettings) => void] {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [settings, setSettings];
}

export function formatOccurrencePreset(n: number): string {
  if (!Number.isFinite(n)) return "All words";
  return `≤ ${n} occurrences`;
}

export function formatRankPreset(n: number): string {
  if (n <= 0) return "All words";
  return `Outside top ${n}`;
}

/**
 * Word-help settings: which words get a help card, and how frequency is tuned.
 * The file reads top-to-bottom as five parts:
 *   1. Types       — the settings shape (WordHelpSettingsState) and config shape.
 *   2. Config      — FREQUENCY_CONFIG: per-corpus presets/defaults (the tunable data).
 *   3. Context     — the active corpus, so consumers resolve the right store.
 *   4. Persistence — localStorage read/write, with defensive coercion of stored JSON.
 *   5. Store       — one useSyncExternalStore-backed store per corpus + the hook.
 * Parts 2, 4, and 5 are all keyed by CorpusId (thresholds are corpus-relative;
 * see FrequencyConfig).
 */

import { createContext, useContext, useSyncExternalStore } from "react";
import type { CorpusId } from "@/bible/corpora";

// Structural shape interface for words which can be filtered based on frequency
// within corpus
interface FrequencyWord {
  lemma_count: number;
  lemma_rank: number;
}

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
//
// The `*IsCustom` flags distinguish "user has selected Custom" from "the
// current value happens not to match a preset" — needed because clicking the
// Custom radio while the value is still a preset shouldn't change the value,
// only the UI affordance shown. Without the flag, there would be no way to
// enter Custom mode at all from a preset value.
export interface WordHelpSettingsState {
  mode: WordHelpMode;
  // Show help for lemmas occurring at most this many times in the corpus.
  // Use Number.POSITIVE_INFINITY to mean "show help for every word".
  occurrencesThreshold: number;
  occurrencesIsCustom: boolean;
  // Show help for lemmas ranked strictly higher than this (rank 1 = most common).
  // Use 0 to mean "show help for every word".
  rankThreshold: number;
  rankIsCustom: boolean;
  // Whether to show the form/lemma frequency stats on each WordHelp card.
  showFrequencyStats: boolean;
}

export interface FrequencyConfig {
  occurrencePresets: readonly number[];
  rankPresets: readonly number[];
  defaults: WordHelpSettingsState;
}

const FREQUENCY_CONFIG = {
  "greek-nt": {
    occurrencePresets: [5, 10, 20, 50, 100, Number.POSITIVE_INFINITY],
    rankPresets: [100, 250, 500, 1000, 0],
    defaults: {
      mode: "occurrences",
      occurrencesThreshold: 10,
      occurrencesIsCustom: false,
      rankThreshold: 500,
      rankIsCustom: false,
      showFrequencyStats: true,
    },
  },
  "hebrew-bible": {
    occurrencePresets: [10, 25, 50, 100, 200, Number.POSITIVE_INFINITY],
    rankPresets: [200, 500, 1000, 2000, 0],
    defaults: {
      mode: "occurrences",
      occurrencesThreshold: 25,
      occurrencesIsCustom: false,
      rankThreshold: 1000,
      rankIsCustom: false,
      showFrequencyStats: true,
    },
  },
} as const satisfies Record<CorpusId, FrequencyConfig>;

// The active corpus for word-help settings, provided once at ReaderLayout so
// every consumer (the settings menu, the passage filter, the word-help cards)
// resolves to the right per-corpus store without threading a prop through each.
// Defaults to the site's default corpus for any stray consumer outside a reader.
export const WordHelpCorpusContext = createContext<CorpusId>("greek-nt");

export function useFrequencyConfig(): FrequencyConfig {
  return FREQUENCY_CONFIG[useContext(WordHelpCorpusContext)];
}

const STORAGE_KEY_BASE = "darash.word-help-settings.v1";

function storageKey(corpus: CorpusId): string {
  return `${STORAGE_KEY_BASE}.${corpus}`;
}

export function shouldShowHelp(word: FrequencyWord, settings: WordHelpSettingsState): boolean {
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

function coerceBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function readStored(corpus: CorpusId): WordHelpSettingsState {
  const defaults = FREQUENCY_CONFIG[corpus].defaults;
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey(corpus));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<WordHelpSettingsState>;
    return {
      mode: isWordHelpMode(parsed.mode) ? parsed.mode : defaults.mode,
      occurrencesThreshold: coerceThreshold(
        parsed.occurrencesThreshold,
        defaults.occurrencesThreshold,
      ),
      occurrencesIsCustom: coerceBool(parsed.occurrencesIsCustom, defaults.occurrencesIsCustom),
      rankThreshold: coerceThreshold(parsed.rankThreshold, defaults.rankThreshold),
      rankIsCustom: coerceBool(parsed.rankIsCustom, defaults.rankIsCustom),
      showFrequencyStats: coerceBool(parsed.showFrequencyStats, defaults.showFrequencyStats),
    };
  } catch {
    return defaults;
  }
}

// One store per corpus, created lazily. Every consumer of a given corpus shares
// its store's object reference (so changes from the menu propagate to the
// passage filter immediately); different corpora keep independent settings and
// persist to independent localStorage keys.
interface Store {
  getSnapshot: () => WordHelpSettingsState;
  subscribe: (listener: () => void) => () => void;
  setSettings: (next: WordHelpSettingsState) => void;
}

const stores = new Map<CorpusId, Store>();

function persist(corpus: CorpusId, next: WordHelpSettingsState): void {
  try {
    // JSON.stringify converts Infinity → null; replace with a sentinel string
    // that readStored knows how to coerce back to Infinity.
    const payload = JSON.stringify(next, (_, v) =>
      v === Number.POSITIVE_INFINITY ? "Infinity" : v,
    );
    window.localStorage.setItem(storageKey(corpus), payload);
  } catch {
    // ignore quota / private-mode failures
  }
}

function storeFor(corpus: CorpusId): Store {
  const existing = stores.get(corpus);
  if (existing) return existing;

  let currentSettings = readStored(corpus);
  const listeners = new Set<() => void>();
  const store: Store = {
    getSnapshot: () => currentSettings,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setSettings: (next) => {
      currentSettings = next;
      persist(corpus, next);
      for (const listener of listeners) listener();
    },
  };
  stores.set(corpus, store);
  return store;
}

export function useWordHelpSettings(): [
  WordHelpSettingsState,
  (next: WordHelpSettingsState) => void,
] {
  const store = storeFor(useContext(WordHelpCorpusContext));
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return [settings, store.setSettings];
}

export function formatOccurrencePreset(n: number): string {
  if (!Number.isFinite(n)) return "All words";
  return `≤ ${n} occurrences`;
}

export function formatRankPreset(n: number): string {
  if (n <= 0) return "All words";
  return `Outside top ${n}`;
}

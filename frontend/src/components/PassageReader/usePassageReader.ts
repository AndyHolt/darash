import { useEffect, useRef, useState } from "react";
import type { WordInteraction } from "@/components/WordHelp";
import { useWordHelpSettings, type WordHelpSettingsState } from "@/components/WordHelpSettings";

export interface PassageReader {
  /** Current word-help settings (frequency threshold, freq-stats toggle). */
  helpSettings: WordHelpSettingsState;
  /**
   * Whether a word has been click-revealed this session. Revealed words keep
   * their help even when the frequency threshold would otherwise exclude them.
   */
  isRevealed: (id: string) => boolean;
  /** Hover/focus/pin props to spread onto a word span or a word-help card. */
  interaction: (id: string) => WordInteraction;
  /**
   * Ref callback registering a word's DOM node by id, so pinning a word can
   * scroll it into view in the text panel.
   */
  registerWord: (id: string) => (el: HTMLElement | null) => void;
}

/**
 * The interaction state machine shared by every text's passage view: which word
 * is hovered/pinned, which have been click-revealed, scroll-resetting on
 * passage change, scrolling a pinned word into view, and clearing the
 * click-driven state when the help settings change. Text-agnostic — the caller
 * keys each word however its data allows and renders the words/cards itself.
 */
export function usePassageReader(): PassageReader {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  // Help for common words is hidden by default to keep the sidebar focused on
  // vocabulary the reader is unlikely to know. Clicking such a word reveals its
  // help for the rest of the session even if the threshold would exclude it.
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [helpSettings] = useWordHelpSettings();
  const focusedId = hoveredId ?? pinnedId;

  const handleWordClick = (id: string) => {
    setPinnedId((curr) => (curr === id ? null : id));
    setRevealedIds((curr) => {
      if (curr.has(id)) return curr;
      const next = new Set(curr);
      next.add(id);
      return next;
    });
  };

  const wordRefs = useRef(new Map<string, HTMLElement>());

  // Reset window scroll when the passage view mounts. The view is keyed by
  // passageRef in the route, so navigating to a new passage remounts it; window
  // scroll lives outside React's tree and would otherwise persist from the
  // previous passage. If a flash of mid-scroll content is ever observed on
  // navigation, switch to useLayoutEffect to run before paint.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Scroll the pinned word into view in the main text panel. Fires when a
  // user clicks a sidebar help item for an off-screen word; clicking a word
  // already on screen is a no-op because of `block: "nearest"`. As above,
  // useLayoutEffect would eliminate any visible scroll lag if it ever shows.
  useEffect(() => {
    if (!pinnedId) return;
    wordRefs.current.get(pinnedId)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pinnedId]);

  // When the help settings change, the click-driven reveal/pin state becomes
  // stale (a pinned word may no longer pass the new threshold, and previously
  // revealed words shouldn't carry forward). Clear both so the sidebar
  // reflects the new threshold immediately.
  // biome-ignore lint/correctness/useExhaustiveDependencies: helpSettings is intentionally a change trigger; the effect body uses only stable setters.
  useEffect(() => {
    setRevealedIds((prev) => (prev.size === 0 ? prev : new Set()));
    setPinnedId((prev) => (prev === null ? prev : null));
  }, [helpSettings]);

  return {
    helpSettings,
    isRevealed: (id) => revealedIds.has(id),
    interaction: (id) => ({
      focused: focusedId === id,
      pinned: pinnedId === id,
      onMouseEnter: () => setHoveredId(id),
      onMouseLeave: () => setHoveredId((curr) => (curr === id ? null : curr)),
      onClick: () => handleWordClick(id),
    }),
    registerWord: (id) => (el) => {
      if (el) wordRefs.current.set(id, el);
      else wordRefs.current.delete(id);
    },
  };
}

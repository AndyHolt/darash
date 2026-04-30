/**
 * Predicates determining which grid-picker buttons should render as disabled,
 * given the current state of passage selection. Each rule uses a strict `<`
 * boundary so that the threshold itself remains selectable — this is what
 * allows single-chapter and single-verse passage ranges.
 */

/**
 * Whether a chapter button should be disabled, given an optional lower-bound
 * threshold. The threshold chapter itself remains enabled (single-chapter
 * range support).
 */
export function chapterIsDisabled(chapter: number, disabledBefore: number | undefined): boolean {
  return disabledBefore !== undefined && chapter < disabledBefore;
}

/**
 * Whether an end-verse button should be disabled, given the start verse and
 * whether the end chapter matches the start chapter. Verses earlier than the
 * start verse are only disabled when the end chapter matches the start chapter
 * — once the user has moved to a later chapter, any verse is a valid endpoint.
 * The start verse itself remains enabled (single-verse range support).
 */
export function endVerseIsDisabled(
  verse: number,
  startVerse: number,
  sameChapter: boolean,
): boolean {
  return sameChapter && verse < startVerse;
}

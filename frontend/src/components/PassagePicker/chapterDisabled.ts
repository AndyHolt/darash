/**
 * Whether a chapter button should be rendered as disabled, given an optional
 * lower-bound threshold. The comparison is strictly `<`, so the threshold
 * chapter itself remains enabled — this is what allows a single-chapter
 * passage range (start chapter == end chapter).
 */
export function chapterIsDisabled(chapter: number, disabledBefore: number | undefined): boolean {
  return disabledBefore !== undefined && chapter < disabledBefore;
}

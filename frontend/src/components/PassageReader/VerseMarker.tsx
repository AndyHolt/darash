/**
 * The chapter/verse reference marker that precedes a verse in a reading view: at
 * a chapter's first verse it shows the chapter number, otherwise the verse
 * number as a superscript.
 *
 * Shared by the Greek and Hebrew readers so the two stay visually identical.
 * Notably the numbers are set in the sans UI font with `font-size-adjust` reset
 * to `none`: the property inherits from the surrounding script container
 * (`.font-greek` 0.52, `.font-hebrew` 0.68) and would otherwise render the
 * numbers at different sizes between the two texts. Resetting it renders them at
 * the sans font's natural size, independent of the script.
 *
 * The inline-end margin is logical, so the marker sits before the word in both
 * LTR (Greek) and RTL (Hebrew). Callers own the decision of *when* to render a
 * marker (their data models differ); this component owns only how it looks.
 */
export function VerseMarker({ chapter, verse }: { chapter: number; verse: number }) {
  if (verse === 1) {
    return (
      <span className="me-1 text-primary font-bold font-sans text-base [font-size-adjust:none]">
        {chapter}
      </span>
    );
  }
  return (
    <sup className="me-1 text-muted-foreground font-sans text-xs [font-size-adjust:none]">
      {verse}
    </sup>
  );
}

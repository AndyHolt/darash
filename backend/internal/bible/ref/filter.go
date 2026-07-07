package ref

import "fmt"

// VersesFilter builds the SQL WHERE clause and named-argument map that select
// the words of a reference. The column names (book/chapter/verse) are shared by
// every corpus table, so both the MorphGNT and TAHOT stores build their queries
// from this single filter.
//
// The args are returned as a plain map[string]any rather than pgx.NamedArgs to
// keep this package free of a database-driver dependency; callers wrap the map
// in pgx.NamedArgs (which is itself a map[string]any) at the query site.
func VersesFilter(r Reference) (where string, args map[string]any) {
	switch r := r.(type) {
	case VerseReference:
		return "book = @book AND chapter = @chapter AND verse = @verse",
			map[string]any{
				"book":    r.Book.String(),
				"chapter": r.Chapter,
				"verse":   r.Verse,
			}

	case RangeReference:
		if r.Start.Chapter == r.End.Chapter {
			return "book = @book AND chapter = @chapter AND verse BETWEEN @start_verse AND @end_verse",
				map[string]any{
					"book":        r.Start.Book.String(),
					"chapter":     r.Start.Chapter,
					"start_verse": r.Start.Verse,
					"end_verse":   r.End.Verse,
				}
		}
		return `book = @book AND (
				   (chapter = @start_chapter AND verse >= @start_verse)
				OR (chapter > @start_chapter AND chapter < @end_chapter)
				OR (chapter = @end_chapter AND verse <= @end_verse)
				)`,
			map[string]any{
				"book":          r.Start.Book.String(),
				"start_chapter": r.Start.Chapter,
				"start_verse":   r.Start.Verse,
				"end_chapter":   r.End.Chapter,
				"end_verse":     r.End.Verse,
			}
	}
	panic(fmt.Sprintf("unhandled Reference type: %T", r))
}

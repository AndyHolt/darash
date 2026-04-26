package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (p *PgStore) WordCount(ctx context.Context) (WordCount, error) {
	query := "SELECT COUNT(*) FROM morphgnt_sblgnt"

	var count int64
	err := p.db.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return WordCount{}, fmt.Errorf("failed to get word count: %w", err)
	}

	return WordCount{Count: count}, nil
}

const versesSelect = `
	SELECT book, chapter, verse, word_index, part_of_speech,
		   person, tense, voice, mood, grammatical_case,
		   number, gender, degree,
		   text, text_word, normalized, lemma
	FROM morphgnt_sblgnt
	WHERE %s
	ORDER BY book, chapter, verse, word_index`

func versesFilter(ref Reference) (where string, args pgx.NamedArgs) {
	switch r := ref.(type) {
	case VerseReference:
		return "book = @book AND chapter = @chapter AND verse = @verse",
			pgx.NamedArgs{
				"book":    r.Book.String(),
				"chapter": r.Chapter,
				"verse":   r.Verse,
			}

	case RangeReference:
		if r.Start.Chapter == r.End.Chapter {
			return "book = @book AND chapter = @chapter AND verse BETWEEN @start_verse AND @end_verse",
				pgx.NamedArgs{
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
			pgx.NamedArgs{
				"book":          r.Start.Book.String(),
				"start_chapter": r.Start.Chapter,
				"start_verse":   r.Start.Verse,
				"end_chapter":   r.End.Chapter,
				"end_verse":     r.End.Verse,
			}
	}
	panic(fmt.Sprintf("unhandled Reference type: %T", ref))
}

func (p *PgStore) FetchVerses(ctx context.Context, ref Reference) (Passage, error) {
	where, args := versesFilter(ref)
	query := fmt.Sprintf(versesSelect, where)
	rows, err := p.db.Query(ctx, query, args)
	if err != nil {
		return Passage{}, fmt.Errorf("query verses: %w", err)
	}
	words, err := pgx.CollectRows(rows, pgx.RowToStructByName[Word])
	if err != nil {
		return Passage{}, fmt.Errorf("convert rows to Words: %w", err)
	}
	return Passage{Reference: ref, Words: words}, nil
}

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

func versesFilter(ref Reference) (where string, args []any) {
	switch r := ref.(type) {
	case VerseReference:
		return "book = $1 AND chapter = $2 AND verse = $3",
			[]any{r.Book.String(), r.Chapter, r.Verse}

	case RangeReference:
		if r.Start.Chapter == r.End.Chapter {
			return "book = $1 AND chapter = $2 AND verse BETWEEN $3 AND $4",
				[]any{r.Start.Book.String(), r.Start.Chapter, r.Start.Verse, r.End.Verse}
		}
		return `book = $1 AND (
				   (chapter = $2 AND verse >= $3)
				OR (chapter > $2 AND chapter < $4)
				OR (chapter = $4 AND verse <= $5)
				)`,
			[]any{r.Start.Book.String(), r.Start.Chapter, r.Start.Verse, r.End.Chapter, r.End.Verse}
	}
	panic(fmt.Sprintf("unhandled Reference type: %T", ref))
}

func (p *PgStore) FetchVerses(ctx context.Context, ref Reference) (Passage, error) {
	where, args := versesFilter(ref)
	query := fmt.Sprintf(versesSelect, where)
	rows, err := p.db.Query(ctx, query, args...)
	if err != nil {
		return Passage{}, fmt.Errorf("query verses: %w", err)
	}
	words, err := pgx.CollectRows(rows, pgx.RowToStructByName[Word])
	if err != nil {
		return Passage{}, fmt.Errorf("convert rows to Words: %w", err)
	}
	return Passage{Reference: ref, Words: words}, nil
}

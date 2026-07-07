package main

import (
	"context"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/jackc/pgx/v5"
)

const versesSelect = `
	SELECT m.book, m.chapter, m.verse, m.word_index, m.part_of_speech,
		m.person, m.tense, m.voice, m.mood, m.grammatical_case,
		m.number, m.gender, m.degree,
		m.text, m.text_word, m.normalized, m.lemma,
		m.normalized_count, m.normalized_rank, m.lemma_count, m.lemma_rank,
		m.paragraph_id,
		COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'form',            lf.form,
					'transliteration', l.transliteration,
					'gloss',           l.gloss,
					'meaning',         l.meaning
				)
			) FILTER (WHERE l.id IS NOT NULL),
			'[]'::jsonb
		) AS lexicon
	FROM morphgnt_sblgnt m
	LEFT JOIN tbesg_lexicon_form lf ON lf.form = m.lemma
	LEFT JOIN tbesg_lexicon l ON l.id = lf.lexicon_id
	WHERE %s
	GROUP BY m.book, m.chapter, m.verse, m.word_index, m.part_of_speech,
		m.person, m.tense, m.voice, m.mood, m.grammatical_case,
		m.number, m.gender, m.degree,
		m.text, m.text_word, m.normalized, m.lemma,
		m.normalized_count, m.normalized_rank, m.lemma_count, m.lemma_rank,
		m.paragraph_id
	ORDER BY m.book, m.chapter, m.verse, m.word_index`

func versesFilter(reference ref.Reference) (where string, args pgx.NamedArgs) {
	switch r := reference.(type) {
	case ref.VerseReference:
		return "book = @book AND chapter = @chapter AND verse = @verse",
			pgx.NamedArgs{
				"book":    r.Book.String(),
				"chapter": r.Chapter,
				"verse":   r.Verse,
			}

	case ref.RangeReference:
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
	panic(fmt.Sprintf("unhandled Reference type: %T", reference))
}

func (p *PgStore) FetchVerses(ctx context.Context, r ref.Reference) ([]Word, error) {
	where, args := versesFilter(r)
	query := fmt.Sprintf(versesSelect, where)
	rows, err := p.db.Query(ctx, query, args)
	if err != nil {
		return nil, fmt.Errorf("query verses: %w", err)
	}
	words, err := pgx.CollectRows(rows, pgx.RowToStructByName[Word])
	if err != nil {
		return nil, fmt.Errorf("convert rows to Words: %w", err)
	}
	return words, nil
}

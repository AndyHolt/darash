package morphgnt

import (
	"context"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	db *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{db: pool}
}

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

func (p *Store) FetchVerses(ctx context.Context, r ref.Reference) ([]Word, error) {
	where, args := ref.VersesFilter(r)
	query := fmt.Sprintf(versesSelect, where)
	rows, err := p.db.Query(ctx, query, pgx.NamedArgs(args))
	if err != nil {
		return nil, fmt.Errorf("query verses: %w", err)
	}
	words, err := pgx.CollectRows(rows, pgx.RowToStructByName[Word])
	if err != nil {
		return nil, fmt.Errorf("convert rows to Words: %w", err)
	}
	return words, nil
}

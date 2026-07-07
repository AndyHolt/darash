package main

import (
	"context"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type tahotStore struct {
	db *pgxpool.Pool
}

func newTahotStore(pool *pgxpool.Pool) *tahotStore {
	return &tahotStore{db: pool}
}

// tahotVersesSelect aggregates each word's morpheme segments into a jsonb array
// (mirroring the lexicon aggregation in versesSelect). GROUP BY w.id alone is
// valid because id is the primary key of tahot_words, so every w.* column is
// functionally dependent on it. Ordering is by w.id (reading order assigned at
// load time) since word_index is TEXT and not numerically sortable.
const tahotVersesSelect = `
	SELECT w.book, w.chapter, w.verse, w.word_index, w.hebrew_ref,
		w.text_type, w.variant_markers, w.has_meaning_variant,
		w.hebrew, w.transliteration, w.translation, w.grammar,
		w.meaning_variants, w.spelling_variants,
		w.root_strong, w.root_sstrong, w.alt_strongs, w.expanded_strongs,
		w.form_count, w.form_rank, w.lemma_count, w.lemma_rank,
		COALESCE(
			jsonb_agg(
				jsonb_build_object(
					'segment_index',   s.segment_index,
					'kind',            s.kind,
					'hebrew',          s.hebrew,
					'transliteration', s.transliteration,
					'gloss',           s.gloss,
					'strong',          s.strong,
					'morph_code',      s.morph_code,
					'language',        s.language,
					'part_of_speech',  s.part_of_speech,
					'subtype',         s.subtype,
					'verb_stem',       s.verb_stem,
					'verb_type',       s.verb_type,
					'person',          s.person,
					'gender',          s.gender,
					'number',          s.number,
					'state',           s.state,
					'function_marker', s.function_marker
				) ORDER BY s.segment_index
			) FILTER (WHERE s.id IS NOT NULL),
			'[]'::jsonb
		) AS segments
	FROM tahot_words w
	LEFT JOIN tahot_word_segments s ON s.word_id = w.id
	WHERE %s
	GROUP BY w.id
	ORDER BY w.id`

func (p *tahotStore) FetchTahotVerses(ctx context.Context, r ref.Reference) ([]TahotWord, error) {
	where, args := ref.VersesFilter(r)
	query := fmt.Sprintf(tahotVersesSelect, where)
	rows, err := p.db.Query(ctx, query, pgx.NamedArgs(args))
	if err != nil {
		return nil, fmt.Errorf("query tahot verses: %w", err)
	}
	words, err := pgx.CollectRows(rows, pgx.RowToStructByName[TahotWord])
	if err != nil {
		return nil, fmt.Errorf("convert rows to TahotWords: %w", err)
	}
	return words, nil
}

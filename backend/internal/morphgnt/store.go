package morphgnt

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/AndyHolt/darash/backend/internal/sqlite"
)

// Store is the SQLite-backed Repository, reading from the baked data.sqlite.
// The lexicon aggregation uses SQLite's json_group_array / json_object, and rows
// are scanned manually via database/sql, decoding the aggregated lexicon column
// from JSON text.
type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// versesSelect aggregates each word's lexicon entries into a JSON array:
// json_group_array(json_object(...)) FILTER (WHERE l.id IS NOT NULL) keeps words
// with no lexicon match at an empty array, and COALESCE(..., '[]') guards the
// all-filtered group. The column list and its order match scanWord.
const versesSelect = `
	SELECT m.book, m.chapter, m.verse, m.word_index, m.part_of_speech,
		m.person, m.tense, m.voice, m.mood, m.grammatical_case,
		m.number, m.gender, m.degree,
		m.text, m.text_word, m.normalized, m.lemma,
		m.normalized_count, m.normalized_rank, m.lemma_count, m.lemma_rank,
		m.paragraph_id,
		COALESCE(
			json_group_array(
				json_object(
					'form',            lf.form,
					'transliteration', l.transliteration,
					'gloss',           l.gloss,
					'meaning',         l.meaning
				)
			) FILTER (WHERE l.id IS NOT NULL),
			'[]'
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

func (s *Store) FetchVerses(ctx context.Context, r ref.Reference) ([]Word, error) {
	where, args := ref.VersesFilter(r)
	query := fmt.Sprintf(versesSelect, where)

	rows, err := s.db.QueryContext(ctx, query, sqlite.NamedArgs(args)...)
	if err != nil {
		return nil, fmt.Errorf("query verses: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var words []Word
	for rows.Next() {
		w, err := scanWord(rows)
		if err != nil {
			return nil, fmt.Errorf("scan word: %w", err)
		}
		words = append(words, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate verses: %w", err)
	}
	return words, nil
}

// scanWord reads one row of versesSelect. The nullable morphology columns
// scan straight into the Word's pointer fields (NULL becomes a nil pointer);
// the aggregated lexicon column arrives as JSON text and is unmarshalled into
// the Lexicon slice.
func scanWord(rows *sql.Rows) (Word, error) {
	var w Word
	var lexiconJSON string
	if err := rows.Scan(
		&w.Book, &w.Chapter, &w.Verse, &w.WordIndex, &w.PartOfSpeech,
		&w.Person, &w.Tense, &w.Voice, &w.Mood, &w.Case,
		&w.Number, &w.Gender, &w.Degree,
		&w.Text, &w.TextWord, &w.Normalized, &w.Lemma,
		&w.NormalizedCount, &w.NormalizedRank, &w.LemmaCount, &w.LemmaRank,
		&w.ParagraphID,
		&lexiconJSON,
	); err != nil {
		return Word{}, err
	}
	if err := json.Unmarshal([]byte(lexiconJSON), &w.Lexicon); err != nil {
		return Word{}, fmt.Errorf("unmarshal lexicon %q: %w", lexiconJSON, err)
	}
	return w, nil
}

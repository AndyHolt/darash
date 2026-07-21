package tahot

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/AndyHolt/darash/backend/internal/sqlite"
)

// Store is the SQLite-backed Repository, reading from the baked data.sqlite.
// The segment aggregation uses SQLite's json_group_array / json_object, rows are
// scanned manually via database/sql, the aggregated segments column is decoded
// from JSON text, and has_meaning_variant — stored as INTEGER 0/1 because SQLite
// has no boolean — is scanned as an int and folded to bool.
type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// versesSelect aggregates each word's morpheme segments into a JSON array:
// json_group_array(json_object(...) ORDER BY s.segment_index) keeps the segments
// in morpheme order (SQLite ≥3.44 supports ORDER BY inside an aggregate); FILTER
// (WHERE s.id IS NOT NULL) with COALESCE(..., '[]') keeps a word with no segments
// at an empty array. The column list and its order match scanWord.
//
// The tbesh_lexicon join is 1:1 on segments — disambiguated_strong is UNIQUE, and
// a segment carries at most one Strong's — so it neither multiplies rows nor
// disturbs GROUP BY w.id. Segments with no Strong's (punctuation) or an unmatched
// one get a NULL lexicon: the CASE emits SQL NULL rather than an object of NULLs,
// which decodes to a nil *Lexicon. Nesting json_object inside json_object is
// safe because SQLite tags its result as JSON, so it is embedded as an object
// rather than quoted as a string, and CASE preserves that tag.
const versesSelect = `
	SELECT w.book, w.chapter, w.verse, w.word_index, w.hebrew_ref,
		w.text_type, w.variant_markers, w.has_meaning_variant,
		w.hebrew, w.transliteration, w.translation, w.grammar,
		w.meaning_variants, w.spelling_variants,
		w.root_strong, w.root_sstrong, w.alt_strongs, w.expanded_strongs,
		w.form_count, w.form_rank, w.lemma_count, w.lemma_rank,
		COALESCE(
			json_group_array(
				json_object(
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
					'function_marker', s.function_marker,
					'lexicon', CASE WHEN lx.id IS NULL THEN NULL ELSE json_object(
						'hebrew',          lx.hebrew,
						'transliteration', lx.transliteration,
						'morph',           lx.morph,
						'gloss',           lx.gloss,
						'meaning',         lx.meaning,
						'strong_relation', lx.strong_relation
					) END
				) ORDER BY s.segment_index
			) FILTER (WHERE s.id IS NOT NULL),
			'[]'
		) AS segments
	FROM tahot_words w
	LEFT JOIN tahot_word_segments s ON s.word_id = w.id
	LEFT JOIN tbesh_lexicon lx ON lx.disambiguated_strong = s.strong
	WHERE %s
	GROUP BY w.id
	ORDER BY w.id`

func (s *Store) FetchVerses(ctx context.Context, r ref.Reference) ([]Word, error) {
	where, args := ref.VersesFilter(r)
	query := fmt.Sprintf(versesSelect, where)

	rows, err := s.db.QueryContext(ctx, query, sqlite.NamedArgs(args)...)
	if err != nil {
		return nil, fmt.Errorf("query tahot verses: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var words []Word
	for rows.Next() {
		w, err := scanWord(rows)
		if err != nil {
			return nil, fmt.Errorf("scan tahot word: %w", err)
		}
		words = append(words, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate tahot verses: %w", err)
	}
	return words, nil
}

// scanWord reads one row of versesSelect. The nullable columns scan into
// pointer fields (NULL becomes nil); has_meaning_variant arrives as an INTEGER
// and is folded to bool; the aggregated segments column arrives as JSON text and
// is unmarshalled into the Segments slice.
func scanWord(rows *sql.Rows) (Word, error) {
	var w Word
	var hasMeaningVariant int
	var segmentsJSON string
	if err := rows.Scan(
		&w.Book, &w.Chapter, &w.Verse, &w.WordIndex, &w.HebrewRef,
		&w.TextType, &w.VariantMarkers, &hasMeaningVariant,
		&w.Hebrew, &w.Transliteration, &w.Translation, &w.Grammar,
		&w.MeaningVariants, &w.SpellingVariants,
		&w.RootStrong, &w.RootSstrong, &w.AltStrongs, &w.ExpandedStrongs,
		&w.FormCount, &w.FormRank, &w.LemmaCount, &w.LemmaRank,
		&segmentsJSON,
	); err != nil {
		return Word{}, err
	}
	w.HasMeaningVariant = hasMeaningVariant != 0
	if err := json.Unmarshal([]byte(segmentsJSON), &w.Segments); err != nil {
		return Word{}, fmt.Errorf("unmarshal segments %q: %w", segmentsJSON, err)
	}
	return w, nil
}

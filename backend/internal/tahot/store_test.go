package tahot

import (
	"context"
	"database/sql"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/AndyHolt/darash/backend/internal/sqlite"
	"github.com/AndyHolt/darash/backend/internal/sqlite/sqlitetest"
)

// wordRow is a seed row for tahot_words. Only the fields the store tests care
// about are exposed; insertWord fills the rest with placeholders.
type wordRow struct {
	chapter, verse    int
	wordIndex         string
	hebrew            string
	hasMeaningVariant bool
	rootStrong        any // nil (NULL) or a string
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

// insertWord inserts a tahot_words row and returns its id, so segments can be
// linked to it. Words are inserted in reading order, so the autoincrement id
// matches the w.id ordering the store sorts by.
func insertWord(t *testing.T, db *sql.DB, w wordRow) int64 {
	t.Helper()
	res, err := db.Exec(`
		INSERT INTO tahot_words
			(book, chapter, verse, word_index, hebrew_ref,
			 text_type, variant_markers, has_meaning_variant,
			 hebrew, transliteration, translation, grammar,
			 meaning_variants, spelling_variants,
			 root_strong, root_sstrong, alt_strongs, expanded_strongs,
			 form_count, form_rank, lemma_count, lemma_rank)
		VALUES ('Genesis', ?, ?, ?, NULL,
			'wlc', '', ?,
			?, 'translit', 'translation', 'grammar',
			'', '',
			?, NULL, '', '',
			1, 1, 1, 1)`,
		w.chapter, w.verse, w.wordIndex, boolToInt(w.hasMeaningVariant),
		w.hebrew, w.rootStrong)
	if err != nil {
		t.Fatalf("insert word %q: %v", w.hebrew, err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("word id: %v", err)
	}
	return id
}

// segRow is a seed row for tahot_word_segments. The nullable morphology columns
// are `any` so a test can pass nil (SQL NULL) or a string value.
type segRow struct {
	segmentIndex                              int
	kind, hebrew                              string
	translit, gloss, strong, morphCode        any
	language, pos, subtype                    any
	verbStem, verbType                        any
	person, gender, number, state, funcMarker any
}

func insertSegment(t *testing.T, db *sql.DB, wordID int64, s segRow) {
	t.Helper()
	_, err := db.Exec(`
		INSERT INTO tahot_word_segments
			(word_id, segment_index, kind, hebrew,
			 transliteration, gloss, strong, morph_code,
			 language, part_of_speech, subtype,
			 verb_stem, verb_type,
			 person, gender, number, state, function_marker)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		wordID, s.segmentIndex, s.kind, s.hebrew,
		s.translit, s.gloss, s.strong, s.morphCode,
		s.language, s.pos, s.subtype,
		s.verbStem, s.verbType,
		s.person, s.gender, s.number, s.state, s.funcMarker)
	if err != nil {
		t.Fatalf("insert segment %d of word %d: %v", s.segmentIndex, wordID, err)
	}
}

// newStore seeds a Genesis 1 passage and returns a store reading it through the
// real read-only serving path (sqlite.Open), so the test exercises Open's
// pragmas too, not just a writable fixture handle.
//
// Seeded (Genesis 1:1):
//   - בְּרֵאשִׁית: two segments (a prefix with all morphology NULL and a root with
//     full morphology), inserted out of segment_index order to prove the ORDER BY.
//   - הָאָרֶץ: no segments — checks the FILTER/COALESCE empty-array path.
//   - a word with has_meaning_variant set — checks the INTEGER→bool fold.
//
// A word in 1:2 checks the reference filter excludes it.
func newStore(t *testing.T) *Store {
	t.Helper()
	seed, path := sqlitetest.New(t)

	bereshit := insertWord(t, seed, wordRow{
		chapter: 1, verse: 1, wordIndex: "01", hebrew: "בְּרֵאשִׁית",
		rootStrong: "H7225",
	})
	// Inserted index 2 before index 1 to prove the aggregate's ORDER BY.
	insertSegment(t, seed, bereshit, segRow{
		segmentIndex: 2, kind: "root", hebrew: "רֵאשִׁית",
		translit: "reshit", gloss: "beginning", strong: "H7225", morphCode: "Ncfsa",
		language: "Hebrew", pos: "noun", subtype: "common",
		gender: "feminine", number: "singular", state: "absolute",
	})
	insertSegment(t, seed, bereshit, segRow{
		segmentIndex: 1, kind: "prefix", hebrew: "בְּ",
		translit: "be", gloss: "in", strong: "H9003",
	})

	insertWord(t, seed, wordRow{
		chapter: 1, verse: 1, wordIndex: "02", hebrew: "הָאָרֶץ",
	})

	insertWord(t, seed, wordRow{
		chapter: 1, verse: 1, wordIndex: "03", hebrew: "וַיֹּאמֶר",
		hasMeaningVariant: true,
	})

	insertWord(t, seed, wordRow{
		chapter: 1, verse: 2, wordIndex: "01", hebrew: "רוּחַ",
	})

	db, err := sqlite.Open(path)
	if err != nil {
		t.Fatalf("open store db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return NewStore(db)
}

func TestStoreFetchVerses(t *testing.T) {
	store := newStore(t)

	words, err := store.FetchVerses(context.Background(),
		ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1})
	if err != nil {
		t.Fatalf("FetchVerses: %v", err)
	}

	if len(words) != 3 {
		t.Fatalf("got %d words, want 3 (the 1:2 word must be filtered out)", len(words))
	}

	// Ordering by w.id (reading order).
	for i, want := range []string{"בְּרֵאשִׁית", "הָאָרֶץ", "וַיֹּאמֶר"} {
		if words[i].Hebrew != want {
			t.Errorf("words[%d].Hebrew = %q, want %q", i, words[i].Hebrew, want)
		}
	}

	// בְּרֵאשִׁית: two segments, aggregated in segment_index order despite being
	// inserted out of order.
	bereshit := words[0]
	if len(bereshit.Segments) != 2 {
		t.Fatalf("בְּרֵאשִׁית segments: got %d, want 2", len(bereshit.Segments))
	}
	if bereshit.Segments[0].SegmentIndex != 1 || bereshit.Segments[1].SegmentIndex != 2 {
		t.Errorf("segments out of order: got indices %d, %d; want 1, 2",
			bereshit.Segments[0].SegmentIndex, bereshit.Segments[1].SegmentIndex)
	}
	if bereshit.HasMeaningVariant {
		t.Errorf("בְּרֵאשִׁית HasMeaningVariant = true, want false")
	}
	if bereshit.RootStrong == nil || *bereshit.RootStrong != "H7225" {
		t.Errorf("בְּרֵאשִׁית RootStrong = %v, want H7225", bereshit.RootStrong)
	}

	// The prefix segment (index 1) has all morphology NULL → nil pointers.
	prefix := bereshit.Segments[0]
	if prefix.Kind != SegmentKindPrefix {
		t.Errorf("prefix Kind = %q, want prefix", prefix.Kind)
	}
	if prefix.Language != nil {
		t.Errorf("prefix Language = %v, want nil", *prefix.Language)
	}
	if prefix.PartOfSpeech != nil {
		t.Errorf("prefix PartOfSpeech = %v, want nil", *prefix.PartOfSpeech)
	}
	if prefix.Gloss == nil || *prefix.Gloss != "in" {
		t.Errorf("prefix Gloss = %v, want in", prefix.Gloss)
	}

	// The root segment (index 2) has its morphology set → non-nil pointers.
	root := bereshit.Segments[1]
	if root.Language == nil || *root.Language != LanguageHebrew {
		t.Errorf("root Language = %v, want Hebrew", root.Language)
	}
	if root.PartOfSpeech == nil || *root.PartOfSpeech != PartOfSpeechNoun {
		t.Errorf("root PartOfSpeech = %v, want noun", root.PartOfSpeech)
	}
	if root.Gender == nil || *root.Gender != GenderFeminine {
		t.Errorf("root Gender = %v, want feminine", root.Gender)
	}
	if root.State == nil || *root.State != StateAbsolute {
		t.Errorf("root State = %v, want absolute", root.State)
	}
	if root.MorphCode == nil || *root.MorphCode != "Ncfsa" {
		t.Errorf("root MorphCode = %v, want Ncfsa", root.MorphCode)
	}

	// הָאָרֶץ: no segments — the COALESCE path yields an empty (not nil)
	// slice, so it JSON-encodes as [] (an empty array, not null).
	haaretz := words[1]
	if haaretz.Segments == nil {
		t.Errorf("הָאָרֶץ Segments = nil, want empty non-nil slice")
	}
	if len(haaretz.Segments) != 0 {
		t.Errorf("הָאָרֶץ segments: got %d, want 0", len(haaretz.Segments))
	}
	if haaretz.HasMeaningVariant {
		t.Errorf("הָאָרֶץ HasMeaningVariant = true, want false")
	}
	if haaretz.RootStrong != nil {
		t.Errorf("הָאָרֶץ RootStrong = %v, want nil", *haaretz.RootStrong)
	}

	// וַיֹּאמֶר: has_meaning_variant stored as INTEGER 1 folds to true.
	if !words[2].HasMeaningVariant {
		t.Errorf("וַיֹּאמֶר HasMeaningVariant = false, want true")
	}
}

func TestStoreFetchVersesRange(t *testing.T) {
	store := newStore(t)

	r, err := ref.NewRangeReference(
		ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 1},
		ref.VerseReference{Book: ref.Genesis, Chapter: 1, Verse: 2},
	)
	if err != nil {
		t.Fatalf("build range: %v", err)
	}

	words, err := store.FetchVerses(context.Background(), r)
	if err != nil {
		t.Fatalf("FetchVerses: %v", err)
	}

	// Three words in 1:1 plus one in 1:2, ordered across the verse boundary.
	if len(words) != 4 {
		t.Fatalf("got %d words, want 4", len(words))
	}
	if words[3].Verse != 2 || words[3].Hebrew != "רוּחַ" {
		t.Errorf("last word = %d:%q, want 2:רוּחַ", words[3].Verse, words[3].Hebrew)
	}
}

package morphgnt

import (
	"context"
	"database/sql"
	"testing"

	"github.com/AndyHolt/darash/backend/internal/bible/ref"
	"github.com/AndyHolt/darash/backend/internal/sqlite"
	"github.com/AndyHolt/darash/backend/internal/sqlite/sqlitetest"
)

// wordRow is a seed row for morphgnt_sblgnt. The nullable morphology columns are
// `any` so a test can pass nil (SQL NULL) or a string value.
type wordRow struct {
	chapter, verse, wordIndex     int
	pos                           string
	person, tense, voice, mood    any
	gcase, number, gender, degree any
	lemma                         string
	paragraphID                   int
}

func insertWord(t *testing.T, db *sql.DB, w wordRow) {
	t.Helper()
	_, err := db.Exec(`
		INSERT INTO morphgnt_sblgnt
			(book, chapter, verse, word_index, part_of_speech,
			 person, tense, voice, mood, grammatical_case, number, gender, degree,
			 text, text_word, normalized, lemma,
			 normalized_count, normalized_rank, lemma_count, lemma_rank, paragraph_id)
		VALUES ('John', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?)`,
		w.chapter, w.verse, w.wordIndex, w.pos,
		w.person, w.tense, w.voice, w.mood, w.gcase, w.number, w.gender, w.degree,
		w.lemma, w.lemma, w.lemma, w.lemma, w.paragraphID)
	if err != nil {
		t.Fatalf("insert word %q: %v", w.lemma, err)
	}
}

// insertLexicon inserts a lexicon entry and a form row linking it to lemma, so a
// word with that lemma joins to this entry. Returns nothing; call it twice with
// the same lemma to exercise multi-entry aggregation.
func insertLexicon(t *testing.T, db *sql.DB, lemma, translit, gloss, meaning string) {
	t.Helper()
	res, err := db.Exec(`
		INSERT INTO tbesg_lexicon
			(extended_strong, disambiguated_strong, unified_strong,
			 greek, transliteration, morph, gloss, meaning)
		VALUES ('G0000', 'G0000', 'G0000', ?, ?, 'N', ?, ?)`,
		lemma, translit, gloss, meaning)
	if err != nil {
		t.Fatalf("insert lexicon %q: %v", lemma, err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("lexicon id: %v", err)
	}
	if _, err := db.Exec(
		`INSERT INTO tbesg_lexicon_form (lexicon_id, form) VALUES (?, ?)`, id, lemma,
	); err != nil {
		t.Fatalf("insert form %q: %v", lemma, err)
	}
}

// newStore seeds a John 3 passage and returns a store reading it through the
// real read-only serving path (sqlite.Open), so the test exercises Open's
// pragmas too, not just a writable fixture handle.
//
// Seeded (John 3:16): θεός (noun, one lexicon entry), ἀγαπάω (verb with all
// morphology set, two lexicon entries), κόσμος (noun, no lexicon entry). A word
// in 3:17 checks the reference filter excludes it.
func newStore(t *testing.T) *Store {
	t.Helper()
	seed, path := sqlitetest.New(t)

	insertWord(t, seed, wordRow{
		chapter: 3, verse: 16, wordIndex: 1, pos: "noun",
		gcase: "nominative", number: "singular", gender: "masculine",
		lemma: "θεός", paragraphID: 1,
	})
	insertWord(t, seed, wordRow{
		chapter: 3, verse: 16, wordIndex: 2, pos: "verb",
		person: "third", tense: "aorist", voice: "active", mood: "indicative",
		lemma: "ἀγαπάω", paragraphID: 1,
	})
	insertWord(t, seed, wordRow{
		chapter: 3, verse: 16, wordIndex: 3, pos: "noun",
		gcase: "accusative", number: "singular", gender: "masculine",
		lemma: "κόσμος", paragraphID: 1,
	})
	insertWord(t, seed, wordRow{
		chapter: 3, verse: 17, wordIndex: 1, pos: "noun",
		lemma: "κρίνω", paragraphID: 2,
	})

	insertLexicon(t, seed, "θεός", "theos", "God", "deity")
	insertLexicon(t, seed, "ἀγαπάω", "agapao", "to love", "to love (sense a)")
	insertLexicon(t, seed, "ἀγαπάω", "agapao", "to love", "to love (sense b)")

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
		ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16})
	if err != nil {
		t.Fatalf("FetchVerses: %v", err)
	}

	if len(words) != 3 {
		t.Fatalf("got %d words, want 3 (the 3:17 word must be filtered out)", len(words))
	}

	// Ordering by word_index.
	for i, want := range []string{"θεός", "ἀγαπάω", "κόσμος"} {
		if words[i].Lemma != want {
			t.Errorf("words[%d].Lemma = %q, want %q", i, words[i].Lemma, want)
		}
		if words[i].WordIndex != i+1 {
			t.Errorf("words[%d].WordIndex = %d, want %d", i, words[i].WordIndex, i+1)
		}
	}

	// θεός: exactly one lexicon entry, scanned from the JSON aggregate.
	theos := words[0]
	if len(theos.Lexicon) != 1 {
		t.Fatalf("θεός lexicon: got %d entries, want 1", len(theos.Lexicon))
	}
	if got := theos.Lexicon[0]; got != (Lexicon{
		Form: "θεός", Transliteration: "theos", Gloss: "God", Meaning: "deity",
	}) {
		t.Errorf("θεός lexicon[0] = %+v", got)
	}
	// Noun: no verb morphology.
	if theos.Tense != nil {
		t.Errorf("θεός Tense = %v, want nil", *theos.Tense)
	}
	if theos.Gender == nil || *theos.Gender != GenderMasculine {
		t.Errorf("θεός Gender = %v, want masculine", theos.Gender)
	}

	// ἀγαπάω: two lexicon entries aggregate into the array, and every nullable
	// morphology column round-trips as a non-nil pointer.
	agapao := words[1]
	if len(agapao.Lexicon) != 2 {
		t.Errorf("ἀγαπάω lexicon: got %d entries, want 2", len(agapao.Lexicon))
	}
	if agapao.Person == nil || *agapao.Person != PersonThird {
		t.Errorf("ἀγαπάω Person = %v, want third", agapao.Person)
	}
	if agapao.Tense == nil || *agapao.Tense != TenseAorist {
		t.Errorf("ἀγαπάω Tense = %v, want aorist", agapao.Tense)
	}
	if agapao.Voice == nil || *agapao.Voice != VoiceActive {
		t.Errorf("ἀγαπάω Voice = %v, want active", agapao.Voice)
	}
	if agapao.Mood == nil || *agapao.Mood != MoodIndicative {
		t.Errorf("ἀγαπάω Mood = %v, want indicative", agapao.Mood)
	}

	// κόσμος: no lexicon match — the COALESCE path yields an empty (not nil)
	// slice, so it JSON-encodes as [] (an empty array, not null).
	kosmos := words[2]
	if kosmos.Lexicon == nil {
		t.Errorf("κόσμος Lexicon = nil, want empty non-nil slice")
	}
	if len(kosmos.Lexicon) != 0 {
		t.Errorf("κόσμος lexicon: got %d entries, want 0", len(kosmos.Lexicon))
	}
}

func TestStoreFetchVersesRange(t *testing.T) {
	store := newStore(t)

	r, err := ref.NewRangeReference(
		ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 16},
		ref.VerseReference{Book: ref.John, Chapter: 3, Verse: 17},
	)
	if err != nil {
		t.Fatalf("build range: %v", err)
	}

	words, err := store.FetchVerses(context.Background(), r)
	if err != nil {
		t.Fatalf("FetchVerses: %v", err)
	}

	// Three words in 3:16 plus one in 3:17, ordered across the verse boundary.
	if len(words) != 4 {
		t.Fatalf("got %d words, want 4", len(words))
	}
	if words[3].Verse != 17 || words[3].Lemma != "κρίνω" {
		t.Errorf("last word = %d:%q, want 17:κρίνω", words[3].Verse, words[3].Lemma)
	}
}

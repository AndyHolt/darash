// Package sqlitetest builds throwaway SQLite databases for the store tests.
//
// The stores are almost entirely SQL: FetchVerses is a little database/sql
// plumbing around one long query, and the behaviour worth testing lives inside
// that query — json_group_array(... ORDER BY ...) segment ordering, FILTER +
// COALESCE for the segmentless word, LEFT JOIN against GROUP BY, NULL columns
// folding to nil pointers, INTEGER 0/1 folding to bool, and the WHERE fragment
// and named args that ref.VersesFilter hands over. None of that can be checked
// without an engine to execute it, so the store tests run against a real
// database. The layers above the store need no such thing and do not use this
// package: service and handler tests drive a fake Repository instead.
//
// A temp file rather than an in-memory database, because sqlite.Open takes a
// path and applies its read-only pragmas through the DSN — the file is what lets
// a test open the same data the way production does.
//
// The Schema DDL duplicates ingest/src/{morphgnt,tahot,tbesg,tbesh}/sqlite.py on
// purpose: it is the backend's own statement of the shape it expects the baked
// data.sqlite to have. It is not a drift guard — if ingest changes the schema and
// this copy is not updated, the tests keep passing against the stale copy.
// Keeping the two in lockstep is manual discipline.
package sqlitetest

import (
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite" // registers the pure-Go "sqlite" driver
)

// Schema mirrors the tables ingest writes into data.sqlite: the morphgnt corpus,
// the tbesg lexicon (entry + searchable form index), the tahot corpus (word +
// morpheme segments), and the tbesh lexicon (joined to tahot segments by
// disambiguated Strong's, so no form index). INTEGER PRIMARY KEY throughout,
// booleans stored as INTEGER 0/1, and foreign keys declarative only — matching
// what ingest writes.
const Schema = `
CREATE TABLE morphgnt_sblgnt (
    id               INTEGER PRIMARY KEY,
    book             TEXT    NOT NULL,
    chapter          INTEGER NOT NULL,
    verse            INTEGER NOT NULL,
    word_index       INTEGER NOT NULL,
    part_of_speech   TEXT    NOT NULL,
    person           TEXT,
    tense            TEXT,
    voice            TEXT,
    mood             TEXT,
    grammatical_case TEXT,
    number           TEXT,
    gender           TEXT,
    degree           TEXT,
    text             TEXT    NOT NULL,
    text_word        TEXT    NOT NULL,
    normalized       TEXT    NOT NULL,
    lemma            TEXT    NOT NULL,
    normalized_count INTEGER NOT NULL,
    normalized_rank  INTEGER NOT NULL,
    lemma_count      INTEGER NOT NULL,
    lemma_rank       INTEGER NOT NULL,
    paragraph_id     INTEGER NOT NULL,
    UNIQUE (book, chapter, verse, word_index)
);

CREATE INDEX idx_morphgnt_sblgnt_lemma ON morphgnt_sblgnt (lemma);
CREATE INDEX idx_morphgnt_sblgnt_reference ON morphgnt_sblgnt (book, chapter, verse);
CREATE INDEX idx_morphgnt_sblgnt_paragraph ON morphgnt_sblgnt (paragraph_id);

CREATE TABLE tbesg_lexicon (
    id                   INTEGER PRIMARY KEY,
    extended_strong      TEXT NOT NULL,
    disambiguated_strong TEXT NOT NULL,
    unified_strong       TEXT NOT NULL,
    greek                TEXT NOT NULL,
    transliteration      TEXT NOT NULL,
    morph                TEXT NOT NULL,
    gloss                TEXT NOT NULL,
    meaning              TEXT NOT NULL
);

CREATE TABLE tbesg_lexicon_form (
    id          INTEGER PRIMARY KEY,
    lexicon_id  INTEGER NOT NULL REFERENCES tbesg_lexicon(id) ON DELETE CASCADE,
    form        TEXT    NOT NULL
);

CREATE INDEX idx_tbesg_lexicon_greek      ON tbesg_lexicon (greek);
CREATE INDEX idx_tbesg_lexicon_estrong    ON tbesg_lexicon (extended_strong);
CREATE INDEX idx_tbesg_lexicon_form_form  ON tbesg_lexicon_form (form);
CREATE INDEX idx_tbesg_lexicon_form_lexid ON tbesg_lexicon_form (lexicon_id);

CREATE TABLE tahot_words (
    id                  INTEGER PRIMARY KEY,
    book                TEXT    NOT NULL,
    chapter             INTEGER NOT NULL,
    verse               INTEGER NOT NULL,
    word_index          TEXT    NOT NULL,
    hebrew_ref          TEXT,
    text_type           TEXT    NOT NULL,
    variant_markers     TEXT    NOT NULL,
    has_meaning_variant INTEGER NOT NULL,
    hebrew              TEXT    NOT NULL,
    transliteration     TEXT    NOT NULL,
    translation         TEXT    NOT NULL,
    grammar             TEXT    NOT NULL,
    meaning_variants    TEXT    NOT NULL,
    spelling_variants   TEXT    NOT NULL,
    root_strong         TEXT,
    root_sstrong        TEXT,
    alt_strongs         TEXT    NOT NULL,
    expanded_strongs    TEXT    NOT NULL,
    form_count          INTEGER NOT NULL,
    form_rank           INTEGER NOT NULL,
    lemma_count         INTEGER NOT NULL,
    lemma_rank          INTEGER NOT NULL,
    UNIQUE (book, chapter, verse, word_index, hebrew_ref)
);

CREATE TABLE tahot_word_segments (
    id              INTEGER PRIMARY KEY,
    word_id         INTEGER NOT NULL REFERENCES tahot_words(id) ON DELETE CASCADE,
    segment_index   INTEGER NOT NULL,
    kind            TEXT    NOT NULL,
    hebrew          TEXT    NOT NULL,
    transliteration TEXT,
    gloss           TEXT,
    strong          TEXT,
    morph_code      TEXT,
    language        TEXT,
    part_of_speech  TEXT,
    subtype         TEXT,
    verb_stem       TEXT,
    verb_type       TEXT,
    person          TEXT,
    gender          TEXT,
    number          TEXT,
    state           TEXT,
    function_marker TEXT
);

CREATE INDEX idx_tahot_words_root_strong ON tahot_words (root_strong);
CREATE INDEX idx_tahot_words_reference   ON tahot_words (book, chapter, verse);
CREATE INDEX idx_tahot_segments_strong   ON tahot_word_segments (strong);
CREATE INDEX idx_tahot_segments_word_id  ON tahot_word_segments (word_id);

CREATE TABLE tbesh_lexicon (
    id                   INTEGER PRIMARY KEY,
    extended_strong      TEXT NOT NULL,
    disambiguated_strong TEXT NOT NULL,
    strong_relation      TEXT NOT NULL,
    unified_strong       TEXT NOT NULL,
    hebrew               TEXT NOT NULL,
    transliteration      TEXT NOT NULL,
    morph                TEXT NOT NULL,
    gloss                TEXT NOT NULL,
    meaning              TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_tbesh_lexicon_dstrong ON tbesh_lexicon (disambiguated_strong);
CREATE INDEX idx_tbesh_lexicon_estrong        ON tbesh_lexicon (extended_strong);
`

// New creates a temp-file SQLite database with Schema applied and returns an
// open writable handle plus its file path. The file lives under t.TempDir(), so
// it is removed when the test ends; the handle is closed via t.Cleanup.
//
// Seed rows through the returned *sql.DB. To exercise the real serving path,
// open a read-only handle over the same file with sqlite.Open(path).
func New(t *testing.T) (*sql.DB, string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "data.sqlite")

	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatalf("open fixture db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	if _, err := db.Exec(Schema); err != nil {
		t.Fatalf("apply schema: %v", err)
	}
	return db, path
}

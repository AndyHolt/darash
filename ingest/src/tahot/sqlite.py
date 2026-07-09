"""Load parsed TAHOT Words (and their Segments) into SQLite.

SQLite mirror of tahot/db.py. Same two tables — ``tahot_words`` and
``tahot_word_segments`` — with the dialect decisions carried by
``morphgnt/sqlite.py``: ``SERIAL``/``BIGSERIAL``/``BIGINT PRIMARY KEY`` all
become ``INTEGER PRIMARY KEY``, column names are kept identical so the backend's
ported SQL matches unchanged, and the Postgres indexes are reproduced verbatim.

``BOOLEAN`` becomes ``INTEGER`` (SQLite has no boolean type; Python ``bool``
stores as 0/1). Segment ``word_id`` references a word ``id`` assigned in Python
before the insert, so the two streams stay linked without a SERIAL round-trip;
the FK is declarative only (SQLite does not enforce it without
``PRAGMA foreign_keys=ON``).

DROP+CREATE runs before the bulk insert; the ingest orchestration writes to a
temp file and atomically renames it into place, so a mid-load failure never
replaces the previous data.
"""

import logging
import sqlite3

from tahot.morphology import Morphology
from tahot.parser import Segment, Word

log = logging.getLogger(__name__)

SCHEMA_SQL = """
DROP TABLE IF EXISTS tahot_word_segments;
DROP TABLE IF EXISTS tahot_words;

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
    -- hebrew_ref is part of the key: two Hebrew verses can map to one English
    -- verse (e.g. Hebrew 25.19 + 26.1 both display as English Num 26.1), so the
    -- English ref + word index alone is not unique.
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
"""

_WORD_COLUMNS = (
    "id, book, chapter, verse, word_index, hebrew_ref, text_type, variant_markers, "
    "has_meaning_variant, hebrew, transliteration, translation, grammar, "
    "meaning_variants, spelling_variants, root_strong, root_sstrong, alt_strongs, "
    "expanded_strongs, form_count, form_rank, lemma_count, lemma_rank"
)

_SEGMENT_COLUMNS = (
    "id, word_id, segment_index, kind, hebrew, transliteration, gloss, strong, "
    "morph_code, language, part_of_speech, subtype, verb_stem, verb_type, person, "
    "gender, number, state, function_marker"
)


def _placeholders(columns: str) -> str:
    return ", ".join(["?"] * len(columns.split(",")))


_WORD_INSERT = (
    f"INSERT INTO tahot_words ({_WORD_COLUMNS}) VALUES ({_placeholders(_WORD_COLUMNS)})"
)
_SEGMENT_INSERT = (
    f"INSERT INTO tahot_word_segments ({_SEGMENT_COLUMNS}) "
    f"VALUES ({_placeholders(_SEGMENT_COLUMNS)})"
)


def connect(path: str) -> sqlite3.Connection:
    """Open (creating if needed) the SQLite database at `path`."""
    return sqlite3.connect(path)


def _blank_to_none(value: str) -> str | None:
    return value or None


def _na_to_none(value: str) -> str | None:
    """Map an enum's "N/A" sentinel value to SQL NULL."""
    return None if value == "N/A" else value


def _word_to_row(w: Word) -> tuple:
    return (
        w.id,
        w.book.value,
        w.chapter,
        w.verse,
        w.word_index,
        w.hebrew_ref,
        w.text_type,
        w.variant_markers,
        w.has_meaning_variant,
        w.hebrew,
        w.transliteration,
        w.translation,
        w.grammar,
        w.meaning_variants,
        w.spelling_variants,
        _blank_to_none(w.root_strong),
        _blank_to_none(w.root_sstrong),
        w.alt_strongs,
        w.expanded_strongs,
        w.form_count,
        w.form_rank,
        w.lemma_count,
        w.lemma_rank,
    )


def _segment_to_row(seg_id: int, word_id: int, s: Segment) -> tuple:
    m: Morphology | None = s.morphology
    return (
        seg_id,
        word_id,
        s.segment_index,
        str(s.kind),
        s.hebrew,
        s.transliteration,
        s.gloss,
        s.strong,
        s.morph_code,
        m.language.value if m else None,
        m.part_of_speech.value if m else None,
        _na_to_none(m.subtype) if m else None,
        _na_to_none(m.verb_stem) if m else None,
        _na_to_none(m.verb_type.value) if m else None,
        _na_to_none(m.person.value) if m else None,
        _na_to_none(m.gender.value) if m else None,
        _na_to_none(m.number.value) if m else None,
        _na_to_none(m.state.value) if m else None,
        _na_to_none(m.function_marker.value) if m else None,
    )


def _segment_rows(words: list[Word]):
    """Yield segment rows with running ids, linked to their word's id."""
    seg_id = 0
    for w in words:
        for s in w.segments:
            seg_id += 1
            yield _segment_to_row(seg_id, w.id, s)


def load_words(conn: sqlite3.Connection, words: list[Word]) -> None:
    """Recreate the tables and bulk-load all words and segments, then commit.

    Word ids are assigned 1..N in list order (which is reading order) so the
    frontend can order by id; segment ids are a separate running sequence.
    """
    conn.executescript(SCHEMA_SQL)
    for i, w in enumerate(words, start=1):
        w.id = i

    conn.executemany(_WORD_INSERT, (_word_to_row(w) for w in words))
    conn.executemany(_SEGMENT_INSERT, _segment_rows(words))
    conn.commit()

    segment_count = sum(len(w.segments) for w in words)
    log.info(f"Loaded {len(words)} words and {segment_count} segments")

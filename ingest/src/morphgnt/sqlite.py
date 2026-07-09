import logging
import sqlite3
from enum import Enum

from morphgnt.parser import Word

log = logging.getLogger(__name__)

# SQLite mirror of db.py's morphgnt_sblgnt schema. Dialect decisions carried by
# this module (copied by the tahot/tbesg SQLite loaders):
#   - SERIAL PRIMARY KEY -> INTEGER PRIMARY KEY (a rowid alias that autoincrements)
#   - column names kept identical so the backend's ported SQL matches unchanged
#   - index parity with Postgres (lemma / reference / paragraph) so reference
#     lookups stay off table scans
# DROP+CREATE runs before the bulk insert; the ingest orchestration writes to a
# temp file and atomically renames it into place, so a mid-load failure never
# replaces the previous data (the file-level equivalent of db.py's transactional
# TRUNCATE-and-reload).
SCHEMA_SQL = """
DROP TABLE IF EXISTS morphgnt_sblgnt;

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
"""

_INSERT_SQL = (
    "INSERT INTO morphgnt_sblgnt (book, chapter, verse, word_index, part_of_speech, "
    "person, tense, voice, mood, grammatical_case, number, gender, degree, "
    "text, text_word, normalized, lemma, "
    "normalized_count, normalized_rank, lemma_count, lemma_rank, "
    "paragraph_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
)


def connect(path: str) -> sqlite3.Connection:
    """Open (creating if needed) the SQLite database at `path`."""
    return sqlite3.connect(path)


def _nullable(enum_val: Enum) -> str | None:
    """Convert an enum value to its string, mapping NOT_APPLICABLE to None."""
    return None if enum_val.value == "N/A" else enum_val.value


def _word_to_row(w: Word) -> tuple:
    """Convert a Word dataclass to a tuple for INSERT (column order matches _INSERT_SQL)."""
    return (
        w.book.value,
        w.chapter,
        w.verse,
        w.index,
        w.part_of_speech.value,
        _nullable(w.person),
        _nullable(w.tense),
        _nullable(w.voice),
        _nullable(w.mood),
        _nullable(w.case),
        _nullable(w.number),
        _nullable(w.gender),
        _nullable(w.degree),
        w.text,
        w.text_word,
        w.normalized,
        w.lemma,
        w.normalized_count,
        w.normalized_rank,
        w.lemma_count,
        w.lemma_rank,
        w.paragraph_id,
    )


def load_words(conn: sqlite3.Connection, words: list[Word]) -> None:
    """Recreate the table and bulk-load all words, then commit."""
    conn.executescript(SCHEMA_SQL)
    conn.executemany(_INSERT_SQL, (_word_to_row(w) for w in words))
    conn.commit()
    log.info(f"Loaded {len(words)} words")

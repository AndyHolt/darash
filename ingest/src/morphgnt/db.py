import logging
from enum import Enum

import psycopg

from morphgnt.parser import Word

log = logging.getLogger(__name__)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS morphgnt_sblgnt (
    id               SERIAL PRIMARY KEY,
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
    UNIQUE (book, chapter, verse, word_index)
);

CREATE INDEX IF NOT EXISTS idx_morphgnt_sblgnt_lemma ON morphgnt_sblgnt (lemma);
CREATE INDEX IF NOT EXISTS idx_morphgnt_sblgnt_reference ON morphgnt_sblgnt (book, chapter, verse);
"""


def connect() -> psycopg.Connection:
    """Connect using PG* environment variables (libpq defaults)."""
    return psycopg.connect(autocommit=True)


def ensure_schema(conn: psycopg.Connection) -> None:
    """Create the morphgnt_sblgnt table and indexes if they don't exist."""
    conn.execute(SCHEMA_SQL)
    log.info("Schema ensured")


def _nullable(enum_val: Enum) -> str | None:
    """Convert an enum value to its string, mapping NOT_APPLICABLE to None."""
    return None if enum_val.value == "N/A" else enum_val.value


def _word_to_row(w: Word) -> tuple:
    """Convert a Word dataclass to a tuple for COPY insertion."""
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
    )


def load_words(conn: psycopg.Connection, words: list[Word]) -> None:
    """Truncate and bulk-load all words in a single transaction."""
    with conn.transaction():
        conn.execute("TRUNCATE morphgnt_sblgnt")
        with conn.cursor().copy(
            "COPY morphgnt_sblgnt (book, chapter, verse, word_index, part_of_speech, "
            "person, tense, voice, mood, grammatical_case, number, gender, degree, "
            "text, text_word, normalized, lemma) FROM STDIN"
        ) as copy:
            for w in words:
                copy.write_row(_word_to_row(w))
    log.info(f"Loaded {len(words)} words")

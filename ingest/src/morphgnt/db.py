import logging
from enum import Enum

import psycopg

from morphgnt.parser import Word

log = logging.getLogger(__name__)

# DROP+CREATE+COPY runs inside a single transaction in load_words(), so a
# mid-load failure rolls back to the previous ingest's data.
SCHEMA_SQL = """
DROP TABLE IF EXISTS morphgnt_sblgnt;

CREATE TABLE morphgnt_sblgnt (
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


def connect() -> psycopg.Connection:
    """Connect using PG* environment variables (libpq defaults)."""
    return psycopg.connect(autocommit=True)


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
        w.normalized_count,
        w.normalized_rank,
        w.lemma_count,
        w.lemma_rank,
        w.paragraph_id,
    )


def load_words(conn: psycopg.Connection, words: list[Word]) -> None:
    """Recreate the table and bulk-load all words in a single transaction.

    On failure the transaction rolls back, leaving the previous ingest's
    data intact (Postgres DDL is transactional).
    """
    with conn.transaction():
        conn.execute(SCHEMA_SQL)
        with conn.cursor().copy(
            "COPY morphgnt_sblgnt (book, chapter, verse, word_index, part_of_speech, "
            "person, tense, voice, mood, grammatical_case, number, gender, degree, "
            "text, text_word, normalized, lemma, "
            "normalized_count, normalized_rank, lemma_count, lemma_rank, "
            "paragraph_id) FROM STDIN"
        ) as copy:
            for w in words:
                copy.write_row(_word_to_row(w))
    log.info(f"Loaded {len(words)} words")

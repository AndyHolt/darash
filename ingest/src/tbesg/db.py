import logging

import psycopg

from tbesg.parser import Entry

log = logging.getLogger(__name__)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS tbesg_lexicon (
    id                   SERIAL PRIMARY KEY,
    extended_strong      TEXT NOT NULL,
    disambiguated_strong TEXT NOT NULL,
    unified_strong       TEXT NOT NULL,
    greek                TEXT NOT NULL,
    transliteration      TEXT NOT NULL,
    morph                TEXT NOT NULL,
    gloss                TEXT NOT NULL,
    meaning              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tbesg_lexicon_form (
    id          BIGSERIAL PRIMARY KEY,
    lexicon_id  INTEGER NOT NULL REFERENCES tbesg_lexicon(id) ON DELETE CASCADE,
    form        TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tbesg_lexicon_greek         ON tbesg_lexicon (greek);
CREATE INDEX IF NOT EXISTS idx_tbesg_lexicon_estrong       ON tbesg_lexicon (extended_strong);
CREATE INDEX IF NOT EXISTS idx_tbesg_lexicon_form_form     ON tbesg_lexicon_form (form);
CREATE INDEX IF NOT EXISTS idx_tbesg_lexicon_form_lexid    ON tbesg_lexicon_form (lexicon_id);
"""


def connect() -> psycopg.Connection:
    """Connect using PG* environment variables (libpq defaults)."""
    return psycopg.connect(autocommit=True)


def ensure_schema(conn: psycopg.Connection) -> None:
    """Create the tbesg_lexicon table and indexes if they don't exist."""
    conn.execute(SCHEMA_SQL)
    log.info("Schema ensured")


def _entry_to_row(e: Entry) -> tuple:
    return (
        e.extended_strong,
        e.disambiguated_strong,
        e.unified_strong,
        e.greek,
        e.transliteration,
        e.morph,
        e.gloss,
        e.meaning,
    )


def load_entries(conn: psycopg.Connection, entries: list[Entry]) -> None:
    """Truncate and bulk-load all entries (and their split forms) in one txn.

    `RESTART IDENTITY` resets the SERIAL sequence so the i-th COPY row is
    assigned id i+1, which the form loader uses to fan out variant forms.
    `CASCADE` truncates `tbesg_lexicon_form` via the FK.
    """
    with conn.transaction():
        conn.execute("TRUNCATE tbesg_lexicon RESTART IDENTITY CASCADE")
        with conn.cursor().copy(
            "COPY tbesg_lexicon (extended_strong, disambiguated_strong, unified_strong, "
            "greek, transliteration, morph, gloss, meaning) FROM STDIN"
        ) as copy:
            for e in entries:
                copy.write_row(_entry_to_row(e))

        form_count = 0
        with conn.cursor().copy(
            "COPY tbesg_lexicon_form (lexicon_id, form) FROM STDIN"
        ) as copy:
            for i, e in enumerate(entries, start=1):
                for form in e.forms():
                    copy.write_row((i, form))
                    form_count += 1
    log.info(f"Loaded {len(entries)} entries and {form_count} forms")

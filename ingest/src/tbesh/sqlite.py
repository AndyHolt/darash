"""Load parsed TBESH lexicon Entries into SQLite.

One table, ``tbesh_lexicon``, holding the source's 8 columns with the dStrong
cell split into its two parts: ``disambiguated_strong`` (the key TAHOT segments
carry, e.g. ``H0430G``) and ``strong_relation`` (the phrase qualifying the
uStrong link, e.g. "a Spelling of"). There is no companion form table — unlike
TBESG, whose Greek entries are found by lexical form and so need a searchable
index fanned out from variant spellings, TBESH is joined on the Strong's number
the corpus already tags every morpheme with.

Dialect decisions follow ``morphgnt/sqlite.py``: ``SERIAL PRIMARY KEY`` becomes
``INTEGER PRIMARY KEY``, left to autoincrement 1..N in insert order on the
freshly rebuilt table.

The UNIQUE index on ``disambiguated_strong`` is both the lookup index the
backend's join uses and a load-time assertion that the key really is unique
across the lexicon — a duplicate in a future release of the source fails the
ingest rather than silently doubling a word's entries.

DROP+CREATE runs before the bulk insert; the ingest orchestration writes to a
temp file and atomically renames it into place, so a mid-load failure never
replaces the previous data.
"""

import logging
import sqlite3

from tbesh.parser import Entry

log = logging.getLogger(__name__)

SCHEMA_SQL = """
DROP TABLE IF EXISTS tbesh_lexicon;

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
"""

_ENTRY_COLUMNS = (
    "extended_strong, disambiguated_strong, strong_relation, unified_strong, "
    "hebrew, transliteration, morph, gloss, meaning"
)


def _placeholders(columns: str) -> str:
    return ", ".join(["?"] * len(columns.split(",")))


_ENTRY_INSERT = f"INSERT INTO tbesh_lexicon ({_ENTRY_COLUMNS}) VALUES ({_placeholders(_ENTRY_COLUMNS)})"


def connect(path: str) -> sqlite3.Connection:
    """Open (creating if needed) the SQLite database at `path`."""
    return sqlite3.connect(path)


def _entry_to_row(e: Entry) -> tuple:
    return (
        e.extended_strong,
        e.dstrong(),
        e.relation(),
        e.unified_strong,
        e.hebrew,
        e.transliteration,
        e.morph,
        e.gloss,
        e.meaning,
    )


def load_entries(conn: sqlite3.Connection, entries: list[Entry]) -> None:
    """Recreate the table and bulk-load all entries, then commit."""
    conn.executescript(SCHEMA_SQL)
    conn.executemany(_ENTRY_INSERT, (_entry_to_row(e) for e in entries))
    conn.commit()
    log.info(f"Loaded {len(entries)} entries")

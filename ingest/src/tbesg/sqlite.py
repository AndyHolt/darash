"""Load parsed TBESG lexicon Entries (and their forms) into SQLite.

SQLite mirror of tbesg/db.py. Same two tables — ``tbesg_lexicon`` (one row per
entry) and ``tbesg_lexicon_form`` (the searchable form index that fans variant
spellings and aligned morphgnt forms out to their entry) — with the dialect
decisions carried by ``morphgnt/sqlite.py``: ``SERIAL``/``BIGSERIAL PRIMARY KEY``
become ``INTEGER PRIMARY KEY``, column names are kept identical, and the Postgres
indexes are reproduced verbatim.

Lexicon ids are not written explicitly: ``INTEGER PRIMARY KEY`` autoincrements
1..N in insert order on the freshly rebuilt table, so the i-th entry gets id i —
which the form loader uses as the foreign key (mirroring the Postgres
``RESTART IDENTITY`` + SERIAL behaviour). The form FK is declarative only (SQLite
does not enforce it without ``PRAGMA foreign_keys=ON``).

DROP+CREATE runs before the bulk insert; the ingest orchestration writes to a
temp file and atomically renames it into place, so a mid-load failure never
replaces the previous data.
"""

import logging
import sqlite3

from tbesg.aliases import AlignedForm, load_aligned_forms
from tbesg.parser import Entry

log = logging.getLogger(__name__)

SCHEMA_SQL = """
DROP TABLE IF EXISTS tbesg_lexicon_form;
DROP TABLE IF EXISTS tbesg_lexicon;

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

CREATE INDEX idx_tbesg_lexicon_greek         ON tbesg_lexicon (greek);
CREATE INDEX idx_tbesg_lexicon_estrong       ON tbesg_lexicon (extended_strong);
CREATE INDEX idx_tbesg_lexicon_form_form     ON tbesg_lexicon_form (form);
CREATE INDEX idx_tbesg_lexicon_form_lexid    ON tbesg_lexicon_form (lexicon_id);
"""

_ENTRY_COLUMNS = (
    "extended_strong, disambiguated_strong, unified_strong, greek, "
    "transliteration, morph, gloss, meaning"
)

_FORM_COLUMNS = "lexicon_id, form"


def _placeholders(columns: str) -> str:
    return ", ".join(["?"] * len(columns.split(",")))


_ENTRY_INSERT = f"INSERT INTO tbesg_lexicon ({_ENTRY_COLUMNS}) VALUES ({_placeholders(_ENTRY_COLUMNS)})"
_FORM_INSERT = f"INSERT INTO tbesg_lexicon_form ({_FORM_COLUMNS}) VALUES ({_placeholders(_FORM_COLUMNS)})"


def connect(path: str) -> sqlite3.Connection:
    """Open (creating if needed) the SQLite database at `path`."""
    return sqlite3.connect(path)


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


def load_entries(
    conn: sqlite3.Connection,
    entries: list[Entry],
    aligned: list[AlignedForm] | None = None,
) -> None:
    """Recreate the tables and bulk-load all entries (and their forms), then commit.

    Entries insert in list order, so the i-th entry's autoincremented id is i,
    which the form rows use as their foreign key to fan out variant forms.
    ``aligned`` defaults to the curated morphgnt→tbesg alignment CSV; every
    aligned tbesg form must already appear in the lexicon or loading fails fast.
    """
    conn.executescript(SCHEMA_SQL)
    conn.executemany(_ENTRY_INSERT, (_entry_to_row(e) for e in entries))

    form_count = 0
    form_to_lex_id: dict[str, int] = {}
    form_rows: list[tuple[int, str]] = []
    for i, e in enumerate(entries, start=1):
        for form in e.forms():
            form_rows.append((i, form))
            form_to_lex_id[form] = i
            form_count += 1

    if aligned is None:
        aligned = load_aligned_forms()
    missing = [a.tbesg for a in aligned if a.tbesg not in form_to_lex_id]
    if missing:
        raise ValueError(
            f"Aligned tbesg forms not present in lexicon: {sorted(set(missing))}"
        )
    form_rows.extend((form_to_lex_id[a.tbesg], a.morphgnt) for a in aligned)

    conn.executemany(_FORM_INSERT, form_rows)
    conn.commit()
    log.info(
        f"Loaded {len(entries)} entries, {form_count} forms, "
        f"{len(aligned)} morphgnt aliases"
    )

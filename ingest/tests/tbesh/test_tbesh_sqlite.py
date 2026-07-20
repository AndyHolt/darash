import sqlite3

import pytest
from tbesh.parser import Entry
from tbesh.sqlite import connect, load_entries


def entry(extended_strong: str, disambiguated_strong: str, hebrew: str = "אָב") -> Entry:
    """Build an Entry, defaulting the columns the tests don't exercise."""
    return Entry(
        extended_strong=extended_strong,
        disambiguated_strong=disambiguated_strong,
        unified_strong="",
        hebrew=hebrew,
        transliteration="",
        morph="",
        gloss="",
        meaning="",
    )


# H0001 has two disambiguated senses; H0002 links to another entry by relation.
ENTRIES = [
    entry("H0001", "H0001G =", "אָב"),
    entry("H0001", "H0001H = a Part of", "אָב"),
    entry("H0002", "H0002 = in Aramaic of", "אַב"),
]


def _load(tmp_path, entries) -> str:
    db_path = str(tmp_path / "data.sqlite")
    conn = connect(db_path)
    load_entries(conn, entries)
    conn.close()
    return db_path


class TestLoadEntries:
    def test_entries_round_trip_with_autoincrement_ids(self, tmp_path):
        db_path = _load(tmp_path, ENTRIES)

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM tbesh_lexicon ORDER BY id").fetchall()
        conn.close()

        assert [r["id"] for r in rows] == [1, 2, 3]
        assert [r["extended_strong"] for r in rows] == ["H0001", "H0001", "H0002"]
        assert [r["hebrew"] for r in rows] == ["אָב", "אָב", "אַב"]

    def test_dstrong_cell_splits_into_key_and_relation(self, tmp_path):
        db_path = _load(tmp_path, ENTRIES)

        conn = sqlite3.connect(db_path)
        rows = conn.execute(
            "SELECT disambiguated_strong, strong_relation FROM tbesh_lexicon ORDER BY id"
        ).fetchall()
        conn.close()

        assert rows == [
            ("H0001G", ""),
            ("H0001H", "a Part of"),
            ("H0002", "in Aramaic of"),
        ]

    def test_duplicate_dstrong_raises(self, tmp_path):
        # The UNIQUE index asserts the key really is unique across the lexicon,
        # so a duplicate in a future release of the source fails the load.
        conn = connect(str(tmp_path / "data.sqlite"))
        with pytest.raises(sqlite3.IntegrityError):
            load_entries(conn, [entry("H0001", "H0001G ="), entry("H0009", "H0001G =")])
        conn.close()

    def test_indexes_created(self, tmp_path):
        db_path = _load(tmp_path, ENTRIES)

        conn = sqlite3.connect(db_path)
        names = {
            name
            for (name,) in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'index' "
                "AND name LIKE 'idx_%'"
            )
        }
        conn.close()

        assert names == {
            "idx_tbesh_lexicon_dstrong",
            "idx_tbesh_lexicon_estrong",
        }

    def test_reload_replaces_previous_rows(self, tmp_path):
        db_path = str(tmp_path / "data.sqlite")
        conn = connect(db_path)
        load_entries(conn, ENTRIES)
        load_entries(conn, [entry("H0001", "H0001G =")])
        (count,) = conn.execute("SELECT COUNT(*) FROM tbesh_lexicon").fetchone()
        conn.close()

        # DROP+CREATE rebuilds the table rather than appending.
        assert count == 1

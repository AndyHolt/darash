import sqlite3

import pytest
from tbesg.aliases import AlignedForm
from tbesg.parser import Entry
from tbesg.sqlite import connect, load_entries


def entry(extended_strong: str, greek: str) -> Entry:
    """Build an Entry, defaulting the columns the tests don't exercise."""
    return Entry(
        extended_strong=extended_strong,
        disambiguated_strong="",
        unified_strong="",
        greek=greek,
        transliteration="",
        morph="",
        gloss="",
        meaning="",
    )


# G1 has one form; G2 lists two variant spellings (comma-separated).
ENTRIES = [entry("G1", "ἀββά"), entry("G2", "α, Ἀλφα")]
# αββα (morphgnt spelling) aligns to the ἀββά lexicon form.
ALIGNED = [AlignedForm(morphgnt="αββα", tbesg="ἀββά")]


def _load(tmp_path, entries, aligned) -> str:
    db_path = str(tmp_path / "data.sqlite")
    conn = connect(db_path)
    load_entries(conn, entries, aligned=aligned)
    conn.close()
    return db_path


class TestLoadEntries:
    def test_entries_round_trip_with_autoincrement_ids(self, tmp_path):
        db_path = _load(tmp_path, ENTRIES, ALIGNED)

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM tbesg_lexicon ORDER BY id").fetchall()
        conn.close()

        assert [r["id"] for r in rows] == [1, 2]
        assert [r["extended_strong"] for r in rows] == ["G1", "G2"]
        assert [r["greek"] for r in rows] == ["ἀββά", "α, Ἀλφα"]

    def test_forms_fan_out_to_their_entry(self, tmp_path):
        db_path = _load(tmp_path, ENTRIES, ALIGNED)

        conn = sqlite3.connect(db_path)
        # G2's two variant spellings both point at lexicon id 2.
        g2_forms = {
            f
            for (f,) in conn.execute(
                "SELECT form FROM tbesg_lexicon_form WHERE lexicon_id = 2"
            )
        }
        # The aligned morphgnt spelling resolves through the form index to G1.
        (estrong,) = conn.execute(
            "SELECT l.extended_strong FROM tbesg_lexicon_form f "
            "JOIN tbesg_lexicon l ON l.id = f.lexicon_id WHERE f.form = ?",
            ("αββα",),
        ).fetchone()
        (total,) = conn.execute("SELECT COUNT(*) FROM tbesg_lexicon_form").fetchone()
        conn.close()

        assert g2_forms == {"α", "Ἀλφα"}
        assert estrong == "G1"
        # ἀββά + α + Ἀλφα + the αββα alias.
        assert total == 4

    def test_missing_aligned_form_raises(self, tmp_path):
        conn = connect(str(tmp_path / "data.sqlite"))
        with pytest.raises(ValueError, match="not present in lexicon"):
            load_entries(
                conn,
                ENTRIES,
                aligned=[AlignedForm(morphgnt="x", tbesg="notinlexicon")],
            )
        conn.close()

    def test_indexes_match_postgres(self, tmp_path):
        db_path = _load(tmp_path, ENTRIES, ALIGNED)

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
            "idx_tbesg_lexicon_greek",
            "idx_tbesg_lexicon_estrong",
            "idx_tbesg_lexicon_form_form",
            "idx_tbesg_lexicon_form_lexid",
        }

    def test_reload_replaces_previous_rows(self, tmp_path):
        db_path = str(tmp_path / "data.sqlite")
        conn = connect(db_path)
        load_entries(conn, ENTRIES, aligned=ALIGNED)
        load_entries(conn, [entry("G1", "ἀββά")], aligned=ALIGNED)
        (entries,) = conn.execute("SELECT COUNT(*) FROM tbesg_lexicon").fetchone()
        (forms,) = conn.execute("SELECT COUNT(*) FROM tbesg_lexicon_form").fetchone()
        conn.close()

        # DROP+CREATE rebuilds both tables: 1 entry, its ἀββά form + αββα alias.
        assert entries == 1
        assert forms == 2

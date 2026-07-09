import sqlite3

from tahot.parser import Word
from tahot.sqlite import connect, load_words


def line(*cols: str) -> str:
    """Build a tab-separated data line, padding to the full 12 columns."""
    cols = (*cols, *([""] * (12 - len(cols))))
    return "\t".join(cols)


# Gen.1.1#07 — prefix (article) + root (earth) + verse-end punctuation.
GEN_1_1_7 = line(
    "Gen.1.1#07=L",
    "הָ/אָרֶץ\\׃",
    "ha./'A.retz",
    "the/ earth",
    "H9009/{H0776G}\\H9016",
    "HTd/Ncfsa",
    "",
    "",
    "H0776G",
    "",
    "",
    "H9009=ה=the/{H0776G=אֶרֶץ=land}\\H9016=׃=verseEnd",
)

# Lev.23.38#04 — three prefixes (conj + two prepositions) + root.
LEV_23_38_4 = line(
    "Lev.23.38#04=L",
    "וּ/מִ/לְּ/בַד",
    "u./mi./le./Vad",
    "and/ from/ to/ besides",
    "H9002/H9006/H9005/{H0905J}",
    "HC/R/R/Ncmsc",
    "",
    "",
    "H0905J_B",
    "",
    "",
    "H9002=ו=and/H9006=מ=from/H9005=ל=to/{H0905J=בַּד=besides}",
)


def _load(tmp_path, words: list[Word]) -> str:
    db_path = str(tmp_path / "data.sqlite")
    conn = connect(db_path)
    load_words(conn, words)
    conn.close()
    return db_path


class TestLoadWords:
    def test_words_round_trip_with_assigned_ids(self, tmp_path):
        words = [Word.from_line(GEN_1_1_7), Word.from_line(LEV_23_38_4)]
        db_path = _load(tmp_path, words)

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM tahot_words ORDER BY id").fetchall()
        conn.close()

        # ids assigned 1..N in reading order.
        assert [r["id"] for r in rows] == [1, 2]

        gen, lev = rows
        assert gen["book"] == "Genesis"
        assert (gen["chapter"], gen["verse"], gen["word_index"]) == (1, 1, "07")
        # No dual versification -> hebrew_ref is NULL.
        assert gen["hebrew_ref"] is None
        assert gen["text_type"] == "L"
        assert gen["root_strong"] == "H0776G"
        # BOOLEAN -> INTEGER: Python bool stores as 0/1.
        assert gen["has_meaning_variant"] == 0

        assert lev["book"] == "Leviticus"
        assert lev["root_strong"] == "H0905J"

    def test_segments_link_to_words_and_map_na_to_null(self, tmp_path):
        words = [Word.from_line(GEN_1_1_7)]
        db_path = _load(tmp_path, words)

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        segs = conn.execute(
            "SELECT * FROM tahot_word_segments ORDER BY segment_index"
        ).fetchall()
        conn.close()

        assert [s["kind"] for s in segs] == ["prefix", "root", "punctuation"]
        assert all(s["word_id"] == 1 for s in segs)
        assert [s["segment_index"] for s in segs] == [0, 1, 2]

        _prefix, root, punct = segs
        assert root["strong"] == "H0776G"
        assert root["gloss"] == "land"
        assert root["language"] == "Hebrew"
        assert root["part_of_speech"] == "noun"
        assert root["number"] == "singular"
        assert root["state"] == "absolute"
        # Non-applicable morphology fields map to SQL NULL, not "N/A".
        assert root["person"] is None
        assert root["verb_type"] is None

        # Punctuation carries no morphology -> those columns are NULL.
        assert punct["gloss"] == "verseEnd"
        assert punct["language"] is None
        assert punct["part_of_speech"] is None
        assert punct["morph_code"] is None

    def test_segment_ids_run_continuously_across_words(self, tmp_path):
        words = [Word.from_line(GEN_1_1_7), Word.from_line(LEV_23_38_4)]
        db_path = _load(tmp_path, words)

        conn = sqlite3.connect(db_path)
        rows = conn.execute(
            "SELECT id, word_id FROM tahot_word_segments ORDER BY id"
        ).fetchall()
        conn.close()

        # 3 segments for Gen.1.1#07, 4 for Lev.23.38#04; ids are one running
        # sequence, word_id groups them by their parent word.
        assert [r[0] for r in rows] == [1, 2, 3, 4, 5, 6, 7]
        assert [r[1] for r in rows] == [1, 1, 1, 2, 2, 2, 2]

    def test_indexes_match_postgres(self, tmp_path):
        db_path = _load(tmp_path, [Word.from_line(GEN_1_1_7)])

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
            "idx_tahot_words_root_strong",
            "idx_tahot_words_reference",
            "idx_tahot_segments_strong",
            "idx_tahot_segments_word_id",
        }

    def test_reload_replaces_previous_rows(self, tmp_path):
        db_path = str(tmp_path / "data.sqlite")
        conn = connect(db_path)
        load_words(conn, [Word.from_line(GEN_1_1_7), Word.from_line(LEV_23_38_4)])
        load_words(conn, [Word.from_line(GEN_1_1_7)])
        (words,) = conn.execute("SELECT COUNT(*) FROM tahot_words").fetchone()
        (segs,) = conn.execute("SELECT COUNT(*) FROM tahot_word_segments").fetchone()
        conn.close()

        # DROP+CREATE rebuilds both tables each load.
        assert words == 1
        assert segs == 3

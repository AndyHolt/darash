import sqlite3

from morphgnt.parser import parse_morphgnt_book_file
from morphgnt.sqlite import connect, load_words


def _make_words(tmp_path, lines: list[str]):
    book_file = tmp_path / "book.txt"
    book_file.write_text("\n".join(lines), encoding="utf-8")
    return parse_morphgnt_book_file(str(book_file))


class TestLoadWords:
    def test_round_trips_rows(self, tmp_path):
        words = _make_words(
            tmp_path,
            [
                # noun: person/tense/voice/mood are N/A -> NULL columns
                "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος",
                # verb: case/gender N/A -> NULL; the rest populated
                "010102 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω",
            ],
        )
        db_path = str(tmp_path / "data.sqlite")

        conn = connect(db_path)
        load_words(conn, words)
        conn.close()

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM morphgnt_sblgnt ORDER BY id").fetchall()

        assert len(rows) == 2

        # INTEGER PRIMARY KEY autoincrements from 1 in insert order.
        assert [r["id"] for r in rows] == [1, 2]

        noun, verb = rows
        assert noun["book"] == "Matthew"
        assert (noun["chapter"], noun["verse"], noun["word_index"]) == (1, 1, 1)
        assert noun["part_of_speech"] == "noun"
        assert noun["grammatical_case"] == "nominative"
        assert noun["number"] == "singular"
        assert noun["gender"] == "feminine"
        # N/A morphology maps to SQL NULL, not the string "N/A".
        assert noun["person"] is None
        assert noun["tense"] is None
        assert noun["voice"] is None
        assert noun["mood"] is None
        assert noun["lemma"] == "βίβλος"

        assert verb["part_of_speech"] == "verb"
        assert verb["person"] == "third"
        assert verb["tense"] == "aorist"
        assert verb["voice"] == "active"
        assert verb["mood"] == "indicative"
        assert verb["grammatical_case"] is None
        assert verb["gender"] is None
        assert verb["lemma"] == "γεννάω"

        conn.close()

    def test_reload_replaces_previous_rows(self, tmp_path):
        db_path = str(tmp_path / "data.sqlite")
        first = _make_words(
            tmp_path, ["010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος"]
        )
        second = _make_words(
            tmp_path,
            [
                "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος",
                "010102 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω",
            ],
        )

        conn = connect(db_path)
        load_words(conn, first)
        load_words(conn, second)
        (count,) = conn.execute("SELECT COUNT(*) FROM morphgnt_sblgnt").fetchone()
        conn.close()

        # DROP+CREATE in SCHEMA_SQL rebuilds the table each load.
        assert count == 2

    def test_indexes_match_postgres(self, tmp_path):
        words = _make_words(
            tmp_path, ["010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος"]
        )
        db_path = str(tmp_path / "data.sqlite")

        conn = connect(db_path)
        load_words(conn, words)
        names = {
            name
            for (name,) in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'index' "
                "AND name LIKE 'idx_%'"
            )
        }
        conn.close()

        assert names == {
            "idx_morphgnt_sblgnt_lemma",
            "idx_morphgnt_sblgnt_reference",
            "idx_morphgnt_sblgnt_paragraph",
        }

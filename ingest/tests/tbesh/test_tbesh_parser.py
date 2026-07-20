import pytest
from tbesh.parser import Entry, parse_tbesh_file

HEADER_LINE = (
    "eStrong#\tdStrong\tuStrong\tHebrew\tTransliteration\tMorph\tGloss\tMeaning"
)
DIVIDER_LINE = "=" * 80
SAMPLE_DATA_ROW = (
    "H0001\tH0001G =\tH0001G\tאָב\tav\tH:N-M\tfather\t1) father of an individual"
)


def write_file(tmp_path, contents: str, *, with_bom: bool = False) -> str:
    path = tmp_path / "tbesh.txt"
    text = ("﻿" if with_bom else "") + contents
    path.write_text(text, encoding="utf-8")
    return str(path)


class TestParseTbeshFile:
    def test_round_trips_a_data_row_verbatim(self, tmp_path):
        path = write_file(
            tmp_path, "\n".join([HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW]) + "\n"
        )

        entries = parse_tbesh_file(path)

        assert entries == [
            Entry(
                extended_strong="H0001",
                disambiguated_strong="H0001G =",
                unified_strong="H0001G",
                hebrew="אָב",
                transliteration="av",
                morph="H:N-M",
                gloss="father",
                meaning="1) father of an individual",
            )
        ]

    def test_preserves_leading_whitespace_in_meaning(self, tmp_path):
        row = SAMPLE_DATA_ROW.replace("\t1) father", "\t 1) father")
        path = write_file(tmp_path, "\n".join([HEADER_LINE, DIVIDER_LINE, row]) + "\n")

        entries = parse_tbesh_file(path)

        assert entries[0].meaning.startswith(" ")

    def test_strips_bom_and_still_detects_header(self, tmp_path):
        path = write_file(
            tmp_path,
            "\n".join([HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW]) + "\n",
            with_bom=True,
        )

        entries = parse_tbesh_file(path)

        assert len(entries) == 1
        assert entries[0].extended_strong == "H0001"

    def test_skips_preamble_before_header(self, tmp_path):
        preamble = [
            "TBESH - Translators Brief lexicon of Extended Strongs for Hebrew",
            "",
            "========================================================",
            "Some explanatory text with\ttabs\there",
            "",
            "FIELD DESCRIPTIONS:",
        ]
        path = write_file(
            tmp_path,
            "\n".join(preamble + [HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW]) + "\n",
        )

        entries = parse_tbesh_file(path)

        assert len(entries) == 1

    def test_skips_blank_lines_in_data(self, tmp_path):
        second_row = SAMPLE_DATA_ROW.replace("H0001", "H0002")
        path = write_file(
            tmp_path,
            "\n".join([HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW, "", "", second_row])
            + "\n",
        )

        entries = parse_tbesh_file(path)

        assert [e.extended_strong for e in entries] == ["H0001", "H0002"]

    def test_normalizes_hebrew_to_nfc(self, tmp_path):
        # U+FB1D (yod with hiriq) is a composition exclusion, so NFC leaves it as
        # the yod + hiriq pair the TAHOT text spells it with.
        row = SAMPLE_DATA_ROW.replace("אָב", "יִ")
        path = write_file(tmp_path, "\n".join([HEADER_LINE, DIVIDER_LINE, row]) + "\n")

        entries = parse_tbesh_file(path)

        assert entries[0].hebrew == "יִ"

    def test_malformed_data_row_raises(self, tmp_path):
        bad_row = "H0001\tonly\ttwo\textra\tcols\there\tnope"  # 7 columns
        path = write_file(
            tmp_path, "\n".join([HEADER_LINE, DIVIDER_LINE, bad_row]) + "\n"
        )

        with pytest.raises(ValueError, match="expected 8 cols, got 7"):
            parse_tbesh_file(path)

    def test_missing_header_raises(self, tmp_path):
        path = write_file(tmp_path, "no header here\nor here\n")

        with pytest.raises(ValueError, match="column header not found"):
            parse_tbesh_file(path)


class TestEntryStrongs:
    def _entry(self, disambiguated_strong: str) -> Entry:
        return Entry(
            extended_strong="H0001",
            disambiguated_strong=disambiguated_strong,
            unified_strong="H0001G",
            hebrew="אָב",
            transliteration="av",
            morph="H:N-M",
            gloss="father",
            meaning="x",
        )

    def test_plain_entry_has_key_and_no_relation(self):
        e = self._entry("H0001G =")
        assert e.dstrong() == "H0001G"
        assert e.relation() == ""

    def test_linked_entry_splits_key_from_relation(self):
        e = self._entry("H0002 = in Aramaic of")
        assert e.dstrong() == "H0002"
        assert e.relation() == "in Aramaic of"

    def test_prefix_entry_key(self):
        # The H9xxx range covers prefixes, suffixes and punctuation.
        assert self._entry("H9002 =").dstrong() == "H9002"

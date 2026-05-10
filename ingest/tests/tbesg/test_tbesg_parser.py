import pytest
from tbesg.parser import Entry, parse_tbesg_file

HEADER_LINE = (
    "eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\t"
    "Abbott-Smith lexicon (AS), with gaps occationally filled from edited versions of  Middle LSJ"
)
DIVIDER_LINE = "=" * 80
SAMPLE_DATA_ROW = (
    "G0001\tG0001G =\tG0001G\tα, Ἀλφα\tAlpha\tG:N-LI\tAlpha\t <b>Α, α, ἄλφα</b> indecl."
)


def write_file(tmp_path, contents: str, *, with_bom: bool = False) -> str:
    path = tmp_path / "tbesg.txt"
    text = ("﻿" if with_bom else "") + contents
    path.write_text(text, encoding="utf-8")
    return str(path)


class TestParseTbesgFile:
    def test_round_trips_a_data_row_verbatim(self, tmp_path):
        path = write_file(
            tmp_path, "\n".join([HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW]) + "\n"
        )

        entries = parse_tbesg_file(path)

        assert entries == [
            Entry(
                extended_strong="G0001",
                disambiguated_strong="G0001G =",
                unified_strong="G0001G",
                greek="α, Ἀλφα",
                transliteration="Alpha",
                morph="G:N-LI",
                gloss="Alpha",
                meaning=" <b>Α, α, ἄλφα</b> indecl.",
            )
        ]
        assert entries[0].meaning.startswith(" "), "leading space must be preserved"

    def test_strips_bom_and_still_detects_header(self, tmp_path):
        path = write_file(
            tmp_path,
            "\n".join([HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW]) + "\n",
            with_bom=True,
        )

        entries = parse_tbesg_file(path)

        assert len(entries) == 1
        assert entries[0].extended_strong == "G0001"

    def test_skips_preamble_before_header(self, tmp_path):
        preamble = [
            "TBESG - Translators Brief lexicon",
            "",
            "$========== PERSON(s)",
            "Some explanatory text with\ttabs\there",
            "",
            "Fields:",
        ]
        path = write_file(
            tmp_path,
            "\n".join(preamble + [HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW]) + "\n",
        )

        entries = parse_tbesg_file(path)

        assert len(entries) == 1

    def test_skips_blank_lines_in_data(self, tmp_path):
        second_row = SAMPLE_DATA_ROW.replace("G0001", "G0002")
        path = write_file(
            tmp_path,
            "\n".join([HEADER_LINE, DIVIDER_LINE, SAMPLE_DATA_ROW, "", "", second_row])
            + "\n",
        )

        entries = parse_tbesg_file(path)

        assert [e.extended_strong for e in entries] == ["G0001", "G0002"]

    def test_malformed_data_row_raises(self, tmp_path):
        bad_row = "G0001\tonly\ttwo\textra\tcols\there\tnope"  # 7 columns
        path = write_file(
            tmp_path, "\n".join([HEADER_LINE, DIVIDER_LINE, bad_row]) + "\n"
        )

        with pytest.raises(ValueError, match="expected 8 cols, got 7"):
            parse_tbesg_file(path)

    def test_missing_header_raises(self, tmp_path):
        path = write_file(tmp_path, "no header here\nor here\n")

        with pytest.raises(ValueError, match="column header not found"):
            parse_tbesg_file(path)


class TestEntryForms:
    def _entry(self, greek: str) -> Entry:
        return Entry(
            extended_strong="G0001",
            disambiguated_strong="G0001G =",
            unified_strong="G0001G",
            greek=greek,
            transliteration="x",
            morph="x",
            gloss="x",
            meaning="x",
        )

    def test_single_form(self):
        assert self._entry("Ἀαρών").forms() == ["Ἀαρών"]

    def test_splits_on_comma_and_strips(self):
        assert self._entry("α, Ἀλφα").forms() == ["α", "Ἀλφα"]

    def test_drops_empty_fragments(self):
        assert self._entry("α,, Ἀλφα,").forms() == ["α", "Ἀλφα"]

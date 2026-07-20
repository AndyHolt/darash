import logging

import pytest
from tahot.parser import Word
from tbesh.parser import Entry
from tbesh.validate import CoverageError, validate_coverage


def word(hebrew: str, dstrongs: str, grammar: str) -> Word:
    """Build a TAHOT Word from its three /-aligned columns."""
    cols = ("Gen.1.1#01=L", hebrew, "x", "x", dstrongs, grammar, *([""] * 6))
    return Word.from_line("\t".join(cols))


def entry(dstrong: str) -> Entry:
    return Entry(
        extended_strong=dstrong,
        disambiguated_strong=f"{dstrong} =",
        unified_strong="",
        hebrew="",
        transliteration="",
        morph="",
        gloss="",
        meaning="",
    )


# Prefix + root + verse-end punctuation: three segments, three Strong's tokens.
COVERED_WORD = word("הָ/אָרֶץ\\׃", "H9009/{H0776G}\\H9016", "HTd/Ncfsa")
LEXICON = [entry("H9009"), entry("H0776G"), entry("H9016")]


class TestValidateCoverage:
    def test_full_coverage_passes(self):
        validate_coverage([COVERED_WORD], LEXICON)

    def test_uncovered_code_below_floor_raises(self):
        with pytest.raises(CoverageError, match="below the"):
            validate_coverage([COVERED_WORD], [entry("H9009"), entry("H0776G")])

    def test_uncovered_code_above_floor_passes(self, caplog):
        # 2 of 3 tokens covered — allowed by a floor of 50%, but still reported.
        with caplog.at_level(logging.WARNING):
            validate_coverage(
                [COVERED_WORD], [entry("H9009"), entry("H0776G")], minimum=0.5
            )

        assert "H9016 (1)" in caplog.text

    def test_coverage_is_measured_over_tokens_not_distinct_codes(self):
        # One uncovered code on 1 token, one covered code on 9 tokens: 90% by
        # token, 50% by distinct code. A floor of 0.8 must pass.
        covered = word("וְ", "H9002", "HC")
        uncovered = word("אֵת", "{H0853}", "HTo")
        words = [covered] * 9 + [uncovered]

        validate_coverage(words, [entry("H9002")], minimum=0.8)

    def test_segments_without_a_strong_are_not_counted(self):
        # A word whose punctuation segment carries no Strong's: the empty cell is
        # neither covered nor uncovered, so coverage stays 100%.
        w = word("אָרֶץ\\׃", "{H0776G}\\", "Ncfsa")
        assert [s.strong for s in w.segments] == ["H0776G", None]

        validate_coverage([w], [entry("H0776G")])

    def test_no_strongs_at_all_raises(self):
        with pytest.raises(CoverageError, match="no Strong's numbers"):
            validate_coverage([word("׃", "", "")], LEXICON)

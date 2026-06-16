import pytest
from tahot.books import Book
from tahot.morphology import Number, PartOfSpeech, State
from tahot.parser import (
    SegmentKind,
    Word,
    parse_ref,
    parse_tahot_file,
)


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

# Gen.8.17#14 — a Qere whose Ketiv differs only in spelling (lower-case "k"):
# the variant sits in the Spelling Variants column (8), so it is NOT a meaning
# variant.
GEN_8_17_14 = line(
    "Gen.8.17#14=Q(k)",
    "הַיְצֵא",
    "hay.tze'",
    "bring out",
    "{H3318H}",
    "HVhv2ms",
    "",
    "L= הַוְצֵא ¦ ;K= הוֹצֵא",
    "H3318H",
)

# Gen.9.21#07 — a Qere with a meaning-affecting Ketiv (upper-case "K"): the
# variant is recorded in the Meaning Variants column (7).
GEN_9_21_7 = line(
    "Gen.9.21#07=Q(K)",
    "אָהֳל/וֹ\\׃",
    "'o.ho.L/o",
    "tent/ his",
    "{H0168G}/H9023\\H9016",
    "HNcmsc/Sp3ms",
    'K= \'o.ho.Lo/h (אָהֳלֹ/ה\\׃) "tent/ his" (H0168G/H9023\\H9016=HNcbsc/Sp3ms)',
    "L= אָהֳלֹ/ה\\׃ ¦ ;",
    "H0168G",
)


class TestParseRef:
    def test_plain(self):
        ref = parse_ref("Gen.1.1#01=L")
        assert ref.book == Book.GENESIS
        assert (ref.chapter, ref.verse, ref.word_index) == (1, 1, "01")
        assert ref.hebrew_ref is None
        assert ref.text_type == "L"
        assert ref.variant_markers == ""

    def test_dual_versification(self):
        ref = parse_ref("Psa.3.0(3.1)#01=L")
        assert ref.book == Book.PSALMS
        assert (ref.chapter, ref.verse, ref.word_index, ref.hebrew_ref) == (
            3,
            0,
            "01",
            "3.1",
        )

    def test_qere_with_variant_marker(self):
        ref = parse_ref("Gen.8.17#14=Q(k)")
        assert ref.text_type == "Q"
        assert ref.variant_markers == "k"

    def test_multi_source_type_and_marker(self):
        ref = parse_ref("Gen.1.12#09=LAH(b)")
        assert ref.text_type == "LAH"
        assert ref.variant_markers == "b"

    def test_inserted_word_index_kept_as_string(self):
        # LXX restorations carry 4-digit indices; the padding is significant.
        ref = parse_ref("Gen.4.8#0501=X")
        assert ref.word_index == "0501"
        assert ref.text_type == "X"

    def test_invalid_raises(self):
        with pytest.raises(ValueError):
            parse_ref("not a ref")


class TestSegmentation:
    def test_prefix_root_punctuation(self):
        w = Word.from_line(GEN_1_1_7)
        assert [s.kind for s in w.segments] == [
            SegmentKind.PREFIX,
            SegmentKind.ROOT,
            SegmentKind.PUNCTUATION,
        ]
        prefix, root, punct = w.segments
        assert prefix.morphology is not None
        assert root.morphology is not None

        assert prefix.strong == "H9009"
        assert prefix.morphology.part_of_speech == PartOfSpeech.PARTICLE

        assert root.strong == "H0776G"
        assert root.gloss == "land"
        assert root.morphology.part_of_speech == PartOfSpeech.NOUN
        assert root.morphology.number == Number.SINGULAR
        assert root.morphology.state == State.ABSOLUTE

        assert punct.strong == "H9016"
        assert punct.gloss == "verseEnd"
        assert punct.morphology is None

        # The word's lemma key is the root's disambiguated Strong's.
        assert w.root_strong == "H0776G"

    def test_multiple_prefixes_then_root(self):
        w = Word.from_line(LEV_23_38_4)
        assert [s.kind for s in w.segments] == [
            SegmentKind.PREFIX,
            SegmentKind.PREFIX,
            SegmentKind.PREFIX,
            SegmentKind.ROOT,
        ]
        assert [s.strong for s in w.segments] == [
            "H9002",
            "H9006",
            "H9005",
            "H0905J",
        ]
        root = w.segments[-1]
        assert root.morphology is not None
        assert root.morphology.part_of_speech == PartOfSpeech.NOUN


class TestVariants:
    def test_spelling_variant_is_not_a_meaning_variant(self):
        w = Word.from_line(GEN_8_17_14)
        assert w.text_type == "Q"
        assert w.variant_markers == "k"  # lower-case: does not affect meaning
        assert w.has_meaning_variant is False
        assert w.meaning_variants == ""
        assert "K= הוֹצֵא" in w.spelling_variants  # preserved verbatim

    def test_meaning_variant_preserved(self):
        w = Word.from_line(GEN_9_21_7)
        assert w.text_type == "Q"
        assert w.variant_markers == "K"  # upper-case: affects meaning
        assert w.has_meaning_variant is True
        assert w.meaning_variants.startswith("K=")
        # The Qere word still parses normally into segments.
        assert w.root_strong == "H0168G"


class TestParseFile:
    def test_skips_non_data_lines_and_dedups(self, tmp_path):
        content = "\n".join(
            [
                "# Gen.1.1\tsummary line, ignored",
                "Eng (Heb) Ref & Type\tHebrew\t...header, ignored",
                GEN_1_1_7,
                LEV_23_38_4,
                "",
            ]
        )
        f = tmp_path / "sample.txt"
        f.write_text(content, encoding="utf-8")

        words = parse_tahot_file(str(f))
        assert [w.word_index for w in words] == ["07", "04"]

    def test_duplicate_word_index_raises(self, tmp_path):
        f = tmp_path / "dup.txt"
        f.write_text(GEN_1_1_7 + "\n" + GEN_1_1_7, encoding="utf-8")
        with pytest.raises(ValueError, match="Duplicate word index"):
            parse_tahot_file(str(f))

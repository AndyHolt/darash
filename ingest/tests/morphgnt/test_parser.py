import pytest
from morphgnt.parser import (
    Book,
    Case,
    Degree,
    Gender,
    Mood,
    Number,
    PartOfSpeech,
    Person,
    Tense,
    Voice,
    Word,
    parse_morphgnt_book_file,
)

# Real lines from Matthew used across multiple tests
MT_1_1_WORD_1 = "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος"
MT_1_2_WORD_2 = "010102 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω"


class TestWordFromLine:
    def test_noun_parses_all_fields(self):
        word = Word.from_line(MT_1_1_WORD_1, 1)

        assert word.book == Book.MATTHEW
        assert word.chapter == 1
        assert word.verse == 1
        assert word.index == 1
        assert word.part_of_speech == PartOfSpeech.NOUN
        assert word.person == Person.NOT_APPLICABLE
        assert word.tense == Tense.NOT_APPLICABLE
        assert word.voice == Voice.NOT_APPLICABLE
        assert word.mood == Mood.NOT_APPLICABLE
        assert word.case == Case.NOMINATIVE
        assert word.number == Number.SINGULAR
        assert word.gender == Gender.FEMININE
        assert word.degree == Degree.NOT_APPLICABLE
        assert word.text == "Βίβλος"
        assert word.text_word == "Βίβλος"
        assert word.normalized == "βίβλος"
        assert word.lemma == "βίβλος"

    def test_verb_parses_verbal_morphology(self):
        word = Word.from_line(MT_1_2_WORD_2, 2)

        assert word.part_of_speech == PartOfSpeech.VERB
        assert word.person == Person.THIRD
        assert word.tense == Tense.AORIST
        assert word.voice == Voice.ACTIVE
        assert word.mood == Mood.INDICATIVE
        assert word.case == Case.NOT_APPLICABLE
        assert word.number == Number.SINGULAR

    def test_wrong_column_count_raises(self):
        with pytest.raises(ValueError, match="expected 7 items"):
            Word.from_line("010101 N- ----NSF- Βίβλος Βίβλος βίβλος", 1)

    def test_wrong_parsing_code_length_raises(self):
        with pytest.raises(ValueError, match="Expected 8 chars"):
            Word.from_line("010101 N- ---NSF- Βίβλος Βίβλος βίβλος βίβλος", 1)


class TestFromCode:
    def test_invalid_tense_raises(self):
        with pytest.raises(ValueError, match="Invalid tense code"):
            Tense.from_code("Z")

    def test_invalid_case_raises(self):
        with pytest.raises(ValueError, match="Invalid case code"):
            Case.from_code("Z")

    def test_invalid_part_of_speech_raises(self):
        with pytest.raises(ValueError, match="Invalid part of speech code"):
            PartOfSpeech.from_code("ZZ")


class TestBookFromIndex:
    def test_first_book(self):
        assert Book.from_index(1) == Book.MATTHEW

    def test_last_book(self):
        assert Book.from_index(27) == Book.REVELATION

    def test_index_below_range_raises(self):
        with pytest.raises(ValueError, match="Invalid book index"):
            Book.from_index(0)

    def test_index_above_range_raises(self):
        with pytest.raises(ValueError, match="Invalid book index"):
            Book.from_index(28)


class TestVerseIndexTracking:
    def test_index_increments_within_verse_and_resets_on_new_verse(self, tmp_path):
        # 3 words in verse 1:1, 2 words in verse 1:2
        lines = "\n".join(
            [
                "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος",
                "010101 N- ----GSF- γενέσεως γενέσεως γενέσεως γένεσις",
                "010101 N- ----GSM- Ἰησοῦ Ἰησοῦ Ἰησοῦ Ἰησοῦς",
                "010102 N- ----NSM- Ἀβραὰμ Ἀβραὰμ Ἀβραάμ Ἀβραάμ",
                "010102 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω",
            ]
        )
        book_file = tmp_path / "test.txt"
        book_file.write_text(lines, encoding="utf-8")

        words = parse_morphgnt_book_file(str(book_file))

        assert [w.index for w in words] == [1, 2, 3, 1, 2]

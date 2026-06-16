import pytest
from tahot.morphology import (
    FunctionMarker,
    Gender,
    Language,
    Number,
    PartOfSpeech,
    Person,
    State,
    VerbType,
    parse_morph,
)

H = Language.HEBREW
A = Language.ARAMAIC


class TestVerbs:
    def test_wayyiqtol(self):
        m = parse_morph("Vqw3ms", H)
        assert m.part_of_speech == PartOfSpeech.VERB
        assert m.verb_stem == "qal"
        assert m.verb_type == VerbType.SEQUENTIAL_IMPERFECT
        assert m.person == Person.THIRD
        assert m.gender == Gender.MASCULINE
        assert m.number == Number.SINGULAR

    def test_perfect(self):
        m = parse_morph("Vqp1cs", H)
        assert m.verb_type == VerbType.PERFECT
        assert m.person == Person.FIRST
        assert m.gender == Gender.COMMON
        assert m.number == Number.SINGULAR

    def test_active_participle(self):
        m = parse_morph("Vqrmsa", H)
        assert m.verb_type == VerbType.ACTIVE_PARTICIPLE
        assert m.gender == Gender.MASCULINE
        assert m.number == Number.SINGULAR
        assert m.state == State.ABSOLUTE
        assert m.person == Person.NOT_APPLICABLE

    def test_infinitive_construct_vs_cohortative_disambiguation(self):
        # "c" followed by a state letter is an infinitive construct...
        inf = parse_morph("Vqcc", H)
        assert inf.verb_type == VerbType.INFINITIVE_CONSTRUCT
        assert inf.state == State.CONSTRUCT
        # ...but "c" followed by a person digit is a cohortative.
        coh = parse_morph("Vqc1cs", H)
        assert coh.verb_type == VerbType.COHORTATIVE
        assert coh.person == Person.FIRST

    def test_infinitive_absolute(self):
        m = parse_morph("Vqaa", H)
        assert m.verb_type == VerbType.INFINITIVE_ABSOLUTE
        assert m.state == State.ABSOLUTE

    def test_aramaic_stem_differs_from_hebrew_for_same_letter(self):
        assert parse_morph("Vqp3ms", H).verb_stem == "qal"
        assert parse_morph("Vqp3ms", A).verb_stem == "peal"

    def test_invalid_stem_for_language_raises(self):
        # "M" (hithpaal) is an Aramaic-only stem; invalid in Hebrew.
        with pytest.raises(ValueError, match="Hebrew verb stem"):
            parse_morph("VMp3ms", H)


class TestNounsAndOthers:
    def test_common_noun(self):
        m = parse_morph("Ncfsa", H)
        assert m.part_of_speech == PartOfSpeech.NOUN
        assert m.subtype == "common"
        assert m.gender == Gender.FEMININE
        assert m.number == Number.SINGULAR
        assert m.state == State.ABSOLUTE

    def test_construct_plural_noun(self):
        m = parse_morph("Ncmpc", H)
        assert (m.gender, m.number, m.state) == (
            Gender.MASCULINE,
            Number.PLURAL,
            State.CONSTRUCT,
        )

    def test_proper_noun_has_no_inflection(self):
        m = parse_morph("Npl", H)
        assert m.subtype == "proper name (location)"
        assert m.gender == Gender.NOT_APPLICABLE

    def test_definite_article_particle(self):
        m = parse_morph("Td", H)
        assert m.part_of_speech == PartOfSpeech.PARTICLE
        assert m.subtype == "definite article"

    def test_preposition_plain_and_with_article(self):
        assert parse_morph("R", H).part_of_speech == PartOfSpeech.PREPOSITION
        assert parse_morph("Rd", H).subtype == "with article"

    def test_pronominal_suffix(self):
        m = parse_morph("Sp3ms", H)
        assert m.part_of_speech == PartOfSpeech.SUFFIX
        assert m.subtype == "pronominal"
        assert (m.person, m.gender, m.number) == (
            Person.THIRD,
            Gender.MASCULINE,
            Number.SINGULAR,
        )

    def test_conjunction_case_sensitivity(self):
        # Upper-case C is a plain conjunction; lower-case c is the sequential vav.
        assert parse_morph("C", H).part_of_speech == PartOfSpeech.CONJUNCTION
        assert parse_morph("c", H).part_of_speech == PartOfSpeech.SEQUENTIAL_CONJUNCTION


class TestFunctionMarkerAndErrors:
    def test_trailing_function_marker_stripped(self):
        m = parse_morph("Ncfsa-o", H)
        assert m.function_marker == FunctionMarker.OBJECT
        assert m.subtype == "common"

    def test_unknown_part_of_speech_raises(self):
        with pytest.raises(ValueError, match="part-of-speech"):
            parse_morph("Zzz", H)

    def test_bad_feature_letter_raises(self):
        with pytest.raises(ValueError, match="number"):
            parse_morph("Vqp3mz", H)

    def test_empty_code_raises(self):
        with pytest.raises(ValueError, match="Empty"):
            parse_morph("", H)

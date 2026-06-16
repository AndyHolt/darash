"""Decode TAHOT (STEPBible/Tyndale) Hebrew & Aramaic morphology codes.

TAHOT uses STEPBible's *adaptation* of the OpenScriptures Hebrew morphology
(TinyURL.com/HebMorph), not the vanilla codes. The deviations handled here:

- A leading ``H`` / ``A`` marks the whole word as Hebrew or Aramaic. It appears
  only on a word's first segment; the language is then implied for the rest, so
  callers pass it in and the per-segment code given to :func:`parse_morph` is
  already prefix-less.
- Verb stems are *language-dependent*: the same letter means different stems in
  Hebrew vs Aramaic (e.g. ``q`` = qal in Hebrew, peal in Aramaic), so stem
  decoding is keyed on ``(language, code)``.
- STEP-specific verb forms: ``q`` consecutive-perfect (weqatal), ``w``
  consecutive-imperfect (wayyiqtol), ``u`` conjunctive-imperfect (weyyiqtol).
  ``c`` is overloaded — cohortative when a person digit follows, otherwise
  infinitive-construct.
- The sequential vav is tagged as a lower-case ``c`` part-of-speech (a
  conjunction), distinct from upper-case ``C``.
- A trailing ``-o`` / ``-i`` / ``-r`` function marker (object / indirect /
  related). Not present in the current TAHOT data, but stripped defensively.

The cross-cutting facets are decoded into enums (matching the morphgnt parser
idiom); the POS-specific sub-classification is decoded into a human-readable
``subtype`` label (a single field rather than one enum per part of speech, since
the same letter means different things under different parts of speech). The raw
code is preserved alongside on each segment, so nothing is lost.
"""

from dataclasses import dataclass
from enum import Enum


class Language(Enum):
    HEBREW = "Hebrew"
    ARAMAIC = "Aramaic"

    @classmethod
    def from_prefix(cls, char: str) -> "Language":
        if char == "H":
            return cls.HEBREW
        if char == "A":
            return cls.ARAMAIC
        raise ValueError(f"Invalid language prefix: {char!r}")


class PartOfSpeech(Enum):
    ADJECTIVE = "adjective"
    CONJUNCTION = "conjunction"
    SEQUENTIAL_CONJUNCTION = "sequential conjunction"
    ADVERB = "adverb"
    NOUN = "noun"
    PRONOUN = "pronoun"
    PREPOSITION = "preposition"
    SUFFIX = "suffix"
    PARTICLE = "particle"
    VERB = "verb"

    @classmethod
    def from_code(cls, char: str) -> "PartOfSpeech":
        # Case-significant: 'C' regular conjunction vs 'c' sequential vav.
        try:
            return _PARTS_OF_SPEECH[char]
        except KeyError:
            raise ValueError(f"Invalid part-of-speech code: {char!r}") from None


_PARTS_OF_SPEECH: dict[str, PartOfSpeech] = {
    "A": PartOfSpeech.ADJECTIVE,
    "C": PartOfSpeech.CONJUNCTION,
    "c": PartOfSpeech.SEQUENTIAL_CONJUNCTION,
    "D": PartOfSpeech.ADVERB,
    "N": PartOfSpeech.NOUN,
    "P": PartOfSpeech.PRONOUN,
    "R": PartOfSpeech.PREPOSITION,
    "S": PartOfSpeech.SUFFIX,
    "T": PartOfSpeech.PARTICLE,
    "V": PartOfSpeech.VERB,
}


class VerbType(Enum):
    NOT_APPLICABLE = "N/A"
    PERFECT = "perfect"
    SEQUENTIAL_PERFECT = "consecutive perfect"
    IMPERFECT = "imperfect"
    SEQUENTIAL_IMPERFECT = "consecutive imperfect"
    CONJUNCTIVE_IMPERFECT = "conjunctive imperfect"
    JUSSIVE = "jussive"
    COHORTATIVE = "cohortative"
    IMPERATIVE = "imperative"
    INFINITIVE_ABSOLUTE = "infinitive absolute"
    INFINITIVE_CONSTRUCT = "infinitive construct"
    ACTIVE_PARTICIPLE = "active participle"
    PASSIVE_PARTICIPLE = "passive participle"


# Finite verb forms whose tail is person + gender + number.
_FINITE_TYPES: dict[str, VerbType] = {
    "p": VerbType.PERFECT,
    "q": VerbType.SEQUENTIAL_PERFECT,
    "i": VerbType.IMPERFECT,
    "w": VerbType.SEQUENTIAL_IMPERFECT,
    "u": VerbType.CONJUNCTIVE_IMPERFECT,
    "j": VerbType.JUSSIVE,
    "v": VerbType.IMPERATIVE,
}


class Person(Enum):
    NOT_APPLICABLE = "N/A"
    FIRST = "first"
    SECOND = "second"
    THIRD = "third"

    @classmethod
    def from_code(cls, char: str) -> "Person":
        try:
            return {"1": cls.FIRST, "2": cls.SECOND, "3": cls.THIRD}[char]
        except KeyError:
            raise ValueError(f"Invalid person code: {char!r}") from None


class Gender(Enum):
    NOT_APPLICABLE = "N/A"
    MASCULINE = "masculine"
    FEMININE = "feminine"
    COMMON = "common"
    BOTH = "both"

    @classmethod
    def from_code(cls, char: str) -> "Gender":
        try:
            return {
                "m": cls.MASCULINE,
                "f": cls.FEMININE,
                "c": cls.COMMON,
                "b": cls.BOTH,
            }[char]
        except KeyError:
            raise ValueError(f"Invalid gender code: {char!r}") from None


class Number(Enum):
    NOT_APPLICABLE = "N/A"
    SINGULAR = "singular"
    PLURAL = "plural"
    DUAL = "dual"

    @classmethod
    def from_code(cls, char: str) -> "Number":
        try:
            return {"s": cls.SINGULAR, "p": cls.PLURAL, "d": cls.DUAL}[char]
        except KeyError:
            raise ValueError(f"Invalid number code: {char!r}") from None


class State(Enum):
    NOT_APPLICABLE = "N/A"
    ABSOLUTE = "absolute"
    CONSTRUCT = "construct"
    DETERMINED = "determined"

    @classmethod
    def from_code(cls, char: str) -> "State":
        try:
            return {
                "a": cls.ABSOLUTE,
                "c": cls.CONSTRUCT,
                "d": cls.DETERMINED,
            }[char]
        except KeyError:
            raise ValueError(f"Invalid state code: {char!r}") from None


class FunctionMarker(Enum):
    """STEP trailing ``-o`` / ``-i`` / ``-r`` marker (absent in current data)."""

    NOT_APPLICABLE = "N/A"
    OBJECT = "object"
    INDIRECT_OBJECT = "indirect object"
    RELATED = "related"

    @classmethod
    def from_code(cls, char: str) -> "FunctionMarker":
        try:
            return {
                "o": cls.OBJECT,
                "i": cls.INDIRECT_OBJECT,
                "r": cls.RELATED,
            }[char]
        except KeyError:
            raise ValueError(f"Invalid function marker: {char!r}") from None


# Verb stems, keyed on (language, code) — the same letter differs by language.
_VERB_STEMS: dict[tuple[Language, str], str] = {
    (Language.HEBREW, "q"): "qal",
    (Language.HEBREW, "N"): "niphal",
    (Language.HEBREW, "Q"): "qal passive",
    (Language.HEBREW, "p"): "piel",
    (Language.HEBREW, "P"): "pual",
    (Language.HEBREW, "O"): "polal",
    (Language.HEBREW, "D"): "nithpael",
    (Language.HEBREW, "u"): "hothpaal",
    (Language.HEBREW, "t"): "hithpael",
    (Language.HEBREW, "h"): "hiphil",
    (Language.HEBREW, "c"): "tiphil",
    (Language.HEBREW, "H"): "hophal",
    (Language.HEBREW, "v"): "hishtaphel",
    (Language.ARAMAIC, "q"): "peal",
    (Language.ARAMAIC, "Q"): "peil",
    (Language.ARAMAIC, "p"): "pael",
    (Language.ARAMAIC, "u"): "hithpael",
    (Language.ARAMAIC, "P"): "pual",
    (Language.ARAMAIC, "M"): "hithpaal",
    (Language.ARAMAIC, "i"): "itpeel",
    (Language.ARAMAIC, "h"): "haphel",
    (Language.ARAMAIC, "a"): "aphel",
    (Language.ARAMAIC, "e"): "shaphel",
    (Language.ARAMAIC, "H"): "hophal",
    (Language.ARAMAIC, "v"): "ishtaphel",
}

# POS-specific sub-classification letters -> human-readable label.
_NOUN_TYPES = {"c": "common", "g": "gentilic", "m": "numerical", "t": "title"}
_PROPER_TYPES = {
    "m": "proper name (person, masculine)",
    "f": "proper name (person, feminine)",
    "l": "proper name (location)",
    "t": "proper name (title)",
}
_ADJECTIVE_TYPES = {
    "a": "adjective",
    "c": "cardinal number",
    "g": "gentilic",
    "o": "ordinal number",
}
_PRONOUN_TYPES = {
    "d": "demonstrative",
    "i": "interrogative",
    "p": "personal",
    "r": "relative",
}
_SUFFIX_TYPES = {
    "d": "directional he",
    "h": "paragogic he",
    "n": "paragogic nun",
    "p": "pronominal",
}
_PARTICLE_TYPES = {
    "a": "affirmation",
    "c": "conditional",
    "d": "definite article",
    "e": "Aramaic article",
    "i": "interrogative",
    "j": "interjection",
    "m": "demonstrative",
    "n": "negative",
    "o": "object marker",
    "r": "relative",
    "t": "consequence/affirmation",
}

NOT_APPLICABLE = "N/A"


@dataclass
class Morphology:
    """Decoded morphology for a single segment (morpheme)."""

    language: Language
    part_of_speech: PartOfSpeech
    subtype: str  # POS-specific sub-classification label, or "N/A"
    verb_stem: str  # decoded stem name, or "N/A"
    verb_type: VerbType
    person: Person
    gender: Gender
    number: Number
    state: State
    function_marker: FunctionMarker


def parse_morph(code: str, language: Language) -> Morphology:
    """Decode a single prefix-less segment morphology code (e.g. ``Vqw3ms``).

    Raises ``ValueError`` on anything unrecognised — fail-fast, as in the
    morphgnt Greek decoders, so bad data surfaces during ingest rather than
    being silently mis-stored.
    """
    if not code:
        raise ValueError("Empty morphology code")

    function_marker = FunctionMarker.NOT_APPLICABLE
    if "-" in code:
        code, _, marker = code.partition("-")
        function_marker = FunctionMarker.from_code(marker)

    m = Morphology(
        language=language,
        part_of_speech=PartOfSpeech.from_code(code[0]),
        subtype=NOT_APPLICABLE,
        verb_stem=NOT_APPLICABLE,
        verb_type=VerbType.NOT_APPLICABLE,
        person=Person.NOT_APPLICABLE,
        gender=Gender.NOT_APPLICABLE,
        number=Number.NOT_APPLICABLE,
        state=State.NOT_APPLICABLE,
        function_marker=function_marker,
    )
    rest = code[1:]

    match m.part_of_speech:
        case PartOfSpeech.VERB:
            _parse_verb(m, rest, language)
        case PartOfSpeech.NOUN:
            _parse_noun(m, rest)
        case PartOfSpeech.ADJECTIVE:
            m.subtype = _lookup(_ADJECTIVE_TYPES, rest[:1], "adjective type")
            _set_gender_number_state(m, rest[1:])
        case PartOfSpeech.PRONOUN:
            _parse_with_optional_pgn(m, rest, _PRONOUN_TYPES, "pronoun type")
        case PartOfSpeech.SUFFIX:
            _parse_with_optional_pgn(m, rest, _SUFFIX_TYPES, "suffix type")
        case PartOfSpeech.PARTICLE:
            m.subtype = _lookup(_PARTICLE_TYPES, rest[:1], "particle type")
        case PartOfSpeech.PREPOSITION:
            # Bare 'R', or 'Rd' = preposition with assimilated definite article.
            if rest == "d":
                m.subtype = "with article"
            elif rest:
                raise ValueError(f"Invalid preposition code: R{rest}")
        case _:
            # Conjunction, sequential conjunction, adverb carry no further detail.
            if rest:
                raise ValueError(f"Unexpected trailing code: {code}")

    return m


def _parse_verb(m: Morphology, rest: str, language: Language) -> None:
    if len(rest) < 2:
        raise ValueError(f"Verb code too short: V{rest}")
    stem_char, form_char, tail = rest[0], rest[1], rest[2:]
    key = (language, stem_char)
    if key not in _VERB_STEMS:
        raise ValueError(f"Invalid {language.value} verb stem: {stem_char!r}")
    m.verb_stem = _VERB_STEMS[key]

    if form_char in _FINITE_TYPES:
        _parse_finite_verb(m, form_char, tail)
    else:
        _parse_non_finite_verb(m, form_char, tail)


def _parse_finite_verb(m: Morphology, form_char: str, tail: str) -> None:
    m.verb_type = _FINITE_TYPES[form_char]
    _set_person_gender_number(m, tail)


def _parse_non_finite_verb(m: Morphology, form_char: str, tail: str) -> None:
    match form_char:
        # 'c' is overloaded: cohortative if a person digit follows, else inf. construct.
        case "c" if tail[:1] in ("1", "2", "3"):
            m.verb_type = VerbType.COHORTATIVE
            _set_person_gender_number(m, tail)
        case "c":
            m.verb_type = VerbType.INFINITIVE_CONSTRUCT
            _set_infinitive_state(m, tail)
        case "a":
            m.verb_type = VerbType.INFINITIVE_ABSOLUTE
            _set_infinitive_state(m, tail)
        case "r":
            m.verb_type = VerbType.ACTIVE_PARTICIPLE
            _set_gender_number_state(m, tail)
        case "s":
            m.verb_type = VerbType.PASSIVE_PARTICIPLE
            _set_gender_number_state(m, tail)
        case _:
            raise ValueError(f"Invalid verb form: {form_char!r}")


def _parse_noun(m: Morphology, rest: str) -> None:
    if not rest:
        raise ValueError("Noun code missing type")
    type_char = rest[0]
    if type_char == "p":  # proper name — a single sub-category letter, no g/n/s
        m.subtype = _lookup(_PROPER_TYPES, rest[1:2], "proper-noun type")
    else:
        m.subtype = _lookup(_NOUN_TYPES, type_char, "noun type")
        _set_gender_number_state(m, rest[1:])


def _parse_with_optional_pgn(
    m: Morphology, rest: str, types: dict[str, str], label: str
) -> None:
    """Pronoun/suffix: type letter, plus person/gender/number when personal."""
    type_char = rest[:1]
    m.subtype = _lookup(types, type_char, label)
    if type_char == "p":
        _set_person_gender_number(m, rest[1:])


def _set_person_gender_number(m: Morphology, tail: str) -> None:
    if len(tail) != 3:
        raise ValueError(f"Expected person+gender+number, got {tail!r}")
    m.person = Person.from_code(tail[0])
    m.gender = Gender.from_code(tail[1])
    m.number = Number.from_code(tail[2])


def _set_gender_number_state(m: Morphology, tail: str) -> None:
    if len(tail) != 3:
        raise ValueError(f"Expected gender+number+state, got {tail!r}")
    m.gender = Gender.from_code(tail[0])
    m.number = Number.from_code(tail[1])
    m.state = State.from_code(tail[2])


def _set_infinitive_state(m: Morphology, tail: str) -> None:
    if tail:
        m.state = State.from_code(tail[0])


def _lookup(table: dict[str, str], char: str, label: str) -> str:
    try:
        return table[char]
    except KeyError:
        raise ValueError(f"Invalid {label}: {char!r}") from None

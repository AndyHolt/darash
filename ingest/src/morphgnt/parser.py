from dataclasses import dataclass
from enum import Enum
from itertools import groupby


class Book(Enum):
    MATTHEW = "Matthew"
    MARK = "Mark"
    LUKE = "Luke"
    JOHN = "John"
    ACTS = "Acts"
    ROMANS = "Romans"
    FIRST_CORINTHIANS = "1 Corinthians"
    SECOND_CORINTHIANS = "2 Corinthians"
    GALATIANS = "Galatians"
    EPHESIANS = "Ephesians"
    PHILIPPIANS = "Philippians"
    COLOSSIANS = "Colossians"
    FIRST_THESSALONIANS = "1 Thessalonians"
    SECOND_THESSALONIANS = "2 Thessalonians"
    FIRST_TIMOTHY = "1 Timothy"
    SECOND_TIMOTHY = "2 Timothy"
    TITUS = "Titus"
    PHILEMON = "Philemon"
    HEBREWS = "Hebrews"
    JAMES = "James"
    FIRST_PETER = "1 Peter"
    SECOND_PETER = "2 Peter"
    FIRST_JOHN = "1 John"
    SECOND_JOHN = "2 John"
    THIRD_JOHN = "3 John"
    JUDE = "Jude"
    REVELATION = "Revelation"

    @classmethod
    def from_index(cls, index: int) -> "Book":
        _books = {
            1: Book.MATTHEW,
            2: Book.MARK,
            3: Book.LUKE,
            4: Book.JOHN,
            5: Book.ACTS,
            6: Book.ROMANS,
            7: Book.FIRST_CORINTHIANS,
            8: Book.SECOND_CORINTHIANS,
            9: Book.GALATIANS,
            10: Book.EPHESIANS,
            11: Book.PHILIPPIANS,
            12: Book.COLOSSIANS,
            13: Book.FIRST_THESSALONIANS,
            14: Book.SECOND_THESSALONIANS,
            15: Book.FIRST_TIMOTHY,
            16: Book.SECOND_TIMOTHY,
            17: Book.TITUS,
            18: Book.PHILEMON,
            19: Book.HEBREWS,
            20: Book.JAMES,
            21: Book.FIRST_PETER,
            22: Book.SECOND_PETER,
            23: Book.FIRST_JOHN,
            24: Book.SECOND_JOHN,
            25: Book.THIRD_JOHN,
            26: Book.JUDE,
            27: Book.REVELATION,
        }
        if index not in _books:
            raise ValueError(f"Invalid book index: {index}")

        return _books[index]


class PartOfSpeech(Enum):
    ADJECTIVE = "adjective"
    CONJUNCTION = "conjunction"
    ADVERB = "adverb"
    INTERJECTION = "interjection"
    NOUN = "noun"
    PREPOSITION = "preposition"
    ARTICLE = "article"
    DEMONSTRATIVE_PRONOUN = "demonstrative pronoun"
    INTERROGATIVE_INDEFINITE_PRONOUN = "interrogative/indefinite pronoun"
    PERSONAL_PRONOUN = "personal pronoun"
    RELATIVE_PRONOUN = "relative pronoun"
    VERB = "verb"
    PARTICLE = "particle"

    @classmethod
    def from_code(cls, code: str) -> "PartOfSpeech":
        _codes = {
            "A-": cls.ADJECTIVE,
            "C-": cls.CONJUNCTION,
            "D-": cls.ADVERB,
            "I-": cls.INTERJECTION,
            "N-": cls.NOUN,
            "P-": cls.PREPOSITION,
            "RA": cls.ARTICLE,
            "RD": cls.DEMONSTRATIVE_PRONOUN,
            "RI": cls.INTERROGATIVE_INDEFINITE_PRONOUN,
            "RP": cls.PERSONAL_PRONOUN,
            "RR": cls.RELATIVE_PRONOUN,
            "V-": cls.VERB,
            "X-": cls.PARTICLE,
        }
        if code not in _codes:
            raise ValueError(f"Invalid part of speech code: {code}")
        return _codes[code]


class Person(Enum):
    NOT_APPLICABLE = "N/A"
    FIRST = "first"
    SECOND = "second"
    THIRD = "third"

    @classmethod
    def from_code(cls, code: str) -> "Person":
        _codes = {
            "-": cls.NOT_APPLICABLE,
            "1": cls.FIRST,
            "2": cls.SECOND,
            "3": cls.THIRD,
        }
        if code not in _codes:
            raise ValueError(f"Invalid person code: {code}")
        return _codes[code]


class Tense(Enum):
    NOT_APPLICABLE = "N/A"
    PRESENT = "present"
    IMPERFECT = "imperfect"
    FUTURE = "future"
    AORIST = "aorist"
    PERFECT = "perfect"
    PLUPERFECT = "pluperfect"

    @classmethod
    def from_code(cls, code: str) -> "Tense":
        _codes = {
            "-": cls.NOT_APPLICABLE,
            "P": cls.PRESENT,
            "I": cls.IMPERFECT,
            "F": cls.FUTURE,
            "A": cls.AORIST,
            "X": cls.PERFECT,
            "Y": cls.PLUPERFECT,
        }
        if code not in _codes:
            raise ValueError(f"Invalid tense code: {code}")
        return _codes[code]


class Voice(Enum):
    NOT_APPLICABLE = "N/A"
    ACTIVE = "active"
    MIDDLE = "middle"
    PASSIVE = "passive"

    @classmethod
    def from_code(cls, code: str) -> "Voice":
        _codes = {
            "-": cls.NOT_APPLICABLE,
            "A": cls.ACTIVE,
            "M": cls.MIDDLE,
            "P": cls.PASSIVE,
        }
        if code not in _codes:
            raise ValueError(f"Invalid voice code: {code}")
        return _codes[code]


class Mood(Enum):
    NOT_APPLICABLE = "N/A"
    INDICATIVE = "indicative"
    IMPERATIVE = "imperative"
    SUBJUNCTIVE = "subjunctive"
    OPTATIVE = "optative"
    INFINITIVE = "infinitive"
    PARTICIPLE = "participle"

    @classmethod
    def from_code(cls, code: str) -> "Mood":
        _codes = {
            "-": cls.NOT_APPLICABLE,
            "I": cls.INDICATIVE,
            "D": cls.IMPERATIVE,
            "S": cls.SUBJUNCTIVE,
            "O": cls.OPTATIVE,
            "N": cls.INFINITIVE,
            "P": cls.PARTICIPLE,
        }
        if code not in _codes:
            raise ValueError(f"Invalid mood code: {code}")
        return _codes[code]


class Case(Enum):
    NOT_APPLICABLE = "N/A"
    NOMINATIVE = "nominative"
    GENITIVE = "genitive"
    DATIVE = "dative"
    ACCUSATIVE = "accusative"
    VOCATIVE = "vocative"

    @classmethod
    def from_code(cls, code: str) -> "Case":
        _codes = {
            "-": cls.NOT_APPLICABLE,
            "N": cls.NOMINATIVE,
            "G": cls.GENITIVE,
            "D": cls.DATIVE,
            "A": cls.ACCUSATIVE,
            "V": cls.VOCATIVE,
        }
        if code not in _codes:
            raise ValueError(f"Invalid case code: {code}")
        return _codes[code]


class Number(Enum):
    NOT_APPLICABLE = "N/A"
    SINGULAR = "singular"
    PLURAL = "plural"

    @classmethod
    def from_code(cls, code: str) -> "Number":
        _codes = {"-": cls.NOT_APPLICABLE, "S": cls.SINGULAR, "P": cls.PLURAL}
        if code not in _codes:
            raise ValueError(f"Invalid number code: {code}")
        return _codes[code]


class Gender(Enum):
    NOT_APPLICABLE = "N/A"
    MASCULINE = "masculine"
    FEMININE = "feminine"
    NEUTER = "neuter"

    @classmethod
    def from_code(cls, code: str) -> "Gender":
        _codes = {
            "-": cls.NOT_APPLICABLE,
            "M": cls.MASCULINE,
            "F": cls.FEMININE,
            "N": cls.NEUTER,
        }
        if code not in _codes:
            raise ValueError(f"Invalid gender code: {code}")
        return _codes[code]


class Degree(Enum):
    NOT_APPLICABLE = "N/A"
    COMPARATIVE = "comparative"
    SUPERLATIVE = "superlative"

    @classmethod
    def from_code(cls, code: str) -> "Degree":
        _codes = {"-": cls.NOT_APPLICABLE, "C": cls.COMPARATIVE, "S": cls.SUPERLATIVE}
        if code not in _codes:
            raise ValueError(f"Invalid degree code: {code}")
        return _codes[code]


@dataclass
class Word:
    """A single word with morphology"""

    book: Book
    chapter: int
    verse: int
    index: int
    part_of_speech: PartOfSpeech
    person: Person
    tense: Tense
    voice: Voice
    mood: Mood
    case: Case
    number: Number
    gender: Gender
    degree: Degree
    text: str
    text_word: str
    normalized: str
    lemma: str

    @classmethod
    def from_line(cls, line: str, word_in_verse: int) -> "Word":
        parts = line.split()

        if len(parts) != 7:
            raise ValueError(f"Invalid line: expected 7 items, got {len(parts)}")

        ref, part_of_speech, parsing_code, text, text_word, normalized, lemma = parts

        split_parsing_code = list(parsing_code)

        if len(split_parsing_code) != 8:
            raise ValueError(
                f"Invalid parsing code. Expected 8 chars, got {len(split_parsing_code)}: {parsing_code}"
            )

        person, tense, voice, mood, case, number, gender, degree = split_parsing_code

        return cls(
            book=Book.from_index(int(ref[:2])),
            chapter=int(ref[2:4]),
            verse=int(ref[4:]),
            index=word_in_verse,
            part_of_speech=PartOfSpeech.from_code(part_of_speech),
            person=Person.from_code(person),
            tense=Tense.from_code(tense),
            voice=Voice.from_code(voice),
            mood=Mood.from_code(mood),
            case=Case.from_code(case),
            number=Number.from_code(number),
            gender=Gender.from_code(gender),
            degree=Degree.from_code(degree),
            text=text,
            text_word=text_word,
            normalized=normalized,
            lemma=lemma,
        )


def parse_morphgnt_book_file(filename: str) -> list[Word]:
    """
    Parse all words in a book file.

    Arguments:
    - `filename: str`: filename of MorphGNT book.
    """
    book_words = []

    # MorphGNT files are ordered by verse, so groupby correctly groups consecutive lines
    with open(filename, "r", encoding="utf-8") as f:
        for _, verse_lines in groupby(f, key=lambda line: line[:6]):
            for i, line in enumerate(verse_lines, start=1):
                book_words.append(Word.from_line(line, i))

    return book_words

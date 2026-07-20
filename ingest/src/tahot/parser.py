"""Parse TAHOT data lines into Word objects with morpheme Segments.

Each tab-separated data line describes one Hebrew word (e.g. ``Gen.1.1#01=L``).
A word decomposes into ``/``-separated morphemes (prefix / root / suffix), with
``\\``-separated punctuation (verse-end ``׃``, maqqef ``־`` …) appended. Columns
2 (Hebrew), 5 (dStrongs) and 6 (Grammar) share that ``/`` structure in lockstep
(verified across the whole corpus), so segments parse by zipping the columns.
The disambiguated Strong's number of the ``{curly-braced}`` root is the lemma
key used for lexicon alignment and frequency stats.
"""

import re
import unicodedata
from dataclasses import dataclass
from enum import StrEnum
from itertools import groupby

from tahot.books import Book
from tahot.morphology import Language, Morphology, parse_morph

# A data line: Book.chapter.verse with optional (Heb ref), #word, =type.
_REF_RE = re.compile(r"^([A-Za-z0-9]+)\.(\d+)\.(\d+)(?:\(([^)]*)\))?$")
_WORD_TYPE_RE = re.compile(r"^(\d+)=([A-Za-z]+)(?:\(([^)]*)\))?$")
_DATA_LINE_RE = re.compile(r"^[A-Za-z0-9]+\.\d+\.\d+(?:\([^)]*\))?#\d+=")


class SegmentKind(StrEnum):
    PREFIX = "prefix"
    ROOT = "root"
    SUFFIX = "suffix"
    PUNCTUATION = "punctuation"


def _nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text)


@dataclass
class Segment:
    """One morpheme (prefix / root / suffix) or a punctuation mark."""

    segment_index: int
    kind: SegmentKind
    hebrew: str
    transliteration: str | None
    gloss: str | None
    strong: str | None  # disambiguated Strong's number (no braces / instance)
    morph_code: str | None  # raw grammar code, e.g. "Ncfsa"
    morphology: Morphology | None


@dataclass
class Word:
    """A single Hebrew word with its morpheme segments and variant metadata."""

    book: Book
    chapter: int
    verse: int
    word_index: str  # raw token, e.g. "01", "0501" (LXX insert "after word 5")
    hebrew_ref: str | None  # Hebrew versification when it differs from English
    text_type: str  # primary source: L / Q / K / R / X (possibly LAH …)
    variant_markers: str  # parenthetical variant sources, e.g. "K", "b", "AH+B"
    has_meaning_variant: bool
    hebrew: str  # raw column, with / and \ separators
    transliteration: str
    translation: str
    grammar: str  # raw morphology column
    meaning_variants: str  # verbatim
    spelling_variants: str  # verbatim
    root_strong: str  # root's disambiguated Strong's — lemma / lexicon key
    root_sstrong: str  # simple Strong's + instance (col 9), for other-Bible alignment
    alt_strongs: str  # verbatim alternate tagging (col 10)
    expanded_strongs: str  # verbatim expanded tags (col 12)
    segments: list[Segment]
    # Frequency stats — filled by tahot.stats.attach_stats after the whole
    # corpus is parsed (rank is only defined relative to the whole OT).
    form_count: int = 0
    form_rank: int = 0
    lemma_count: int = 0
    lemma_rank: int = 0
    # Assigned sequentially at load time, used as the segments' foreign key.
    id: int = 0

    @classmethod
    def from_line(cls, line: str) -> "Word":
        cols = line.rstrip("\n").split("\t")
        if len(cols) < 12:
            cols += [""] * (12 - len(cols))
        (
            ref,
            hebrew,
            transliteration,
            translation,
            dstrongs,
            grammar,
            meaning_variants,
            spelling_variants,
            root_sstrong,
            alt_strongs,
            _conjoin,
            expanded,
        ) = cols[:12]

        parsed = parse_ref(ref)

        segments = split_segments(hebrew, transliteration, dstrongs, grammar, expanded)
        root = next((s for s in segments if s.kind == SegmentKind.ROOT), None)
        root_strong = root.strong if root and root.strong else ""

        return cls(
            book=parsed.book,
            chapter=parsed.chapter,
            verse=parsed.verse,
            word_index=parsed.word_index,
            hebrew_ref=parsed.hebrew_ref,
            text_type=parsed.text_type,
            variant_markers=parsed.variant_markers,
            has_meaning_variant=bool(meaning_variants.strip()),
            hebrew=_nfc(hebrew),
            transliteration=transliteration,
            translation=translation,
            grammar=grammar,
            meaning_variants=_nfc(meaning_variants),
            spelling_variants=_nfc(spelling_variants),
            root_strong=root_strong,
            root_sstrong=root_sstrong,
            alt_strongs=alt_strongs,
            expanded_strongs=_nfc(expanded),
            segments=segments,
        )


@dataclass
class Ref:
    """The parsed reference+type field of a TAHOT data line."""

    book: Book
    chapter: int
    verse: int
    word_index: str
    hebrew_ref: str | None
    text_type: str
    variant_markers: str


def parse_ref(ref: str) -> Ref:
    """Parse the reference+type field, e.g. ``Gen.1.1#01=L`` or
    ``Psa.3.0(3.1)#01=L`` or ``Gen.8.17#14=Q(k)``.
    """
    left, sep, right = ref.partition("#")
    if not sep:
        raise ValueError(f"Invalid reference (no '#'): {ref!r}")

    ref_match = _REF_RE.match(left)
    if not ref_match:
        raise ValueError(f"Invalid reference: {left!r}")
    book = Book.from_code(ref_match.group(1))
    chapter = int(ref_match.group(2))
    verse = int(ref_match.group(3))
    hebrew_ref = ref_match.group(4)

    word_match = _WORD_TYPE_RE.match(right)
    if not word_match:
        raise ValueError(f"Invalid word/type: {right!r}")
    word_index = word_match.group(1)
    text_type = word_match.group(2)
    variant_markers = word_match.group(3) or ""

    return Ref(
        book=book,
        chapter=chapter,
        verse=verse,
        word_index=word_index,
        hebrew_ref=hebrew_ref,
        text_type=text_type,
        variant_markers=variant_markers,
    )


def split_segments(
    hebrew: str,
    transliteration: str,
    dstrongs: str,
    grammar: str,
    expanded: str,
) -> list[Segment]:
    """Zip the /-aligned columns into per-morpheme + punctuation Segments."""
    heb_parts = hebrew.split("/")
    ds_parts = dstrongs.split("/")
    gr_parts = grammar.split("/")
    tl_parts = transliteration.split("/")
    ex_parts = expanded.split("/")

    # The language prefix (H/A) sits only on the first grammar segment and is
    # implied for the rest of the word.
    language = Language.HEBREW
    if gr_parts and gr_parts[0] and gr_parts[0][0] in "HA":
        language = Language.from_prefix(gr_parts[0][0])
        gr_parts = [gr_parts[0][1:], *gr_parts[1:]]

    root_index = next(
        (i for i, p in enumerate(ds_parts) if "{" in p), len(ds_parts) - 1
    )

    segments: list[Segment] = []
    idx = 0
    for i, ds_part in enumerate(ds_parts):
        ds_head, *ds_punct = ds_part.split("\\")
        heb_head, *heb_punct = _part(heb_parts, i).split("\\")
        ex_head, *ex_punct = _part(ex_parts, i).split("\\")

        if i < root_index:
            kind = SegmentKind.PREFIX
        elif i == root_index:
            kind = SegmentKind.ROOT
        else:
            kind = SegmentKind.SUFFIX

        morph_code = _part(gr_parts, i).strip() or None
        morphology = parse_morph(morph_code, language) if morph_code else None

        segments.append(
            Segment(
                segment_index=idx,
                kind=kind,
                hebrew=_nfc(heb_head),
                transliteration=_clean(_part(tl_parts, i)),
                gloss=_gloss(ex_head),
                strong=_clean_strong(ds_head),
                morph_code=morph_code,
                morphology=morphology,
            )
        )
        idx += 1

        # Punctuation (\-separated) trails the morpheme it attaches to.
        for j, ds_p in enumerate(ds_punct):
            heb_p = heb_punct[j] if j < len(heb_punct) else ""
            ex_p = ex_punct[j] if j < len(ex_punct) else ""
            if not ds_p.strip() and not heb_p.strip():
                continue
            segments.append(
                Segment(
                    segment_index=idx,
                    kind=SegmentKind.PUNCTUATION,
                    hebrew=_nfc(heb_p),
                    transliteration=None,
                    gloss=_gloss(ex_p),
                    strong=_clean_strong(ds_p),
                    morph_code=None,
                    morphology=None,
                )
            )
            idx += 1

    return segments


def parse_tahot_file(path: str) -> list[Word]:
    """Parse one TAHOT book-range file into Words, skipping header/summary lines.

    Lines are kept in file order, which is the reading order (inserted words such
    as LXX restorations carry 4-digit indices like ``0501`` — "after word 5" —
    that sit between their neighbours in the file but are not numerically
    contiguous, so ordering relies on the load-time ``id`` rather than the index).
    Word indices are asserted unique within a verse as a fail-fast integrity check.
    """
    words: list[Word] = []
    with open(path, encoding="utf-8") as f:
        data_lines = (ln for ln in f if _DATA_LINE_RE.match(ln))
        for key, verse_lines in groupby(data_lines, key=lambda ln: ln.split("#", 1)[0]):
            seen: set[str] = set()
            for line in verse_lines:
                word = Word.from_line(line)
                if word.word_index in seen:
                    raise ValueError(
                        f"Duplicate word index {word.word_index} in verse {key!r}"
                    )
                seen.add(word.word_index)
                words.append(word)
    return words


def _part(parts: list[str], i: int) -> str:
    return parts[i] if i < len(parts) else ""


def _clean(value: str) -> str | None:
    return value.strip() or None


def _clean_strong(token: str) -> str | None:
    """Strip ``{}`` braces and the trailing ``+`` (covers-next-word) marker.

    The marker sits *outside* the braces (``{H1008G}+``), so the ``+`` comes off
    first — stripping braces first would leave the closing one stranded behind it.
    """
    token = token.strip().rstrip("+").strip().strip("{}").strip()
    return token or None


def _gloss(token: str) -> str | None:
    """Extract the gloss from an expanded tag like ``{H0776G=אֶרֶץ=land}``."""
    token = token.strip().strip("{}")
    if not token:
        return None
    parts = token.split("=", 2)
    if len(parts) < 3:
        return None
    return parts[2].strip() or None

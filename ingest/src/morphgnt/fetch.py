import logging
import tarfile
import tempfile
import unicodedata
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from morphgnt.parser import Word, parse_morphgnt_book_file

log = logging.getLogger(__name__)

SBLGNT_TARBALL_URL = (
    "https://github.com/morphgnt/sblgnt/archive/refs/heads/master.tar.gz"
)
BOOK_FILE_GLOB = "sblgnt-master/??-*-morphgnt.txt"

VOCAB_TOOLS_BASE = (
    "https://raw.githubusercontent.com/jtauber/vocabulary-tools/master/gnt_data"
)
TOKENS_URL = f"{VOCAB_TOOLS_BASE}/tokens.txt"
PARAGRAPHS_URL = f"{VOCAB_TOOLS_BASE}/paragraphs.txt"


@dataclass(frozen=True)
class TokenRow:
    """One row from jtauber's vocabulary-tools tokens.txt."""

    token_id: int
    lemma: str  # NFC-normalised


@dataclass(frozen=True)
class ParagraphRange:
    """One row from jtauber's vocabulary-tools paragraphs.txt."""

    paragraph_id: int
    start_token_id: int
    end_token_id: int


def fetch_and_parse() -> list[Word]:
    """Download MorphGNT SBLGNT and parse all 27 books into Word objects."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tarball_path = Path(tmpdir) / "sblgnt.tar.gz"

        log.info(f"Downloading {SBLGNT_TARBALL_URL}")
        urllib.request.urlretrieve(SBLGNT_TARBALL_URL, tarball_path)

        log.info("Extracting tarball")
        with tarfile.open(tarball_path) as tar:
            tar.extractall(tmpdir, filter="data")

        book_files = sorted(Path(tmpdir).glob(BOOK_FILE_GLOB))
        log.info(f"Found {len(book_files)} book files")

        if len(book_files) != 27:
            raise RuntimeError(f"Expected 27 book files, found {len(book_files)}")

        all_words: list[Word] = []
        for book_file in book_files:
            words = parse_morphgnt_book_file(str(book_file))
            log.info(f"Parsed {book_file.name}: {len(words)} words")
            all_words.extend(words)

        return all_words


def fetch_tokens() -> list[TokenRow]:
    """Download and parse jtauber's tokens.txt for alignment validation.

    Only token_id and lemma are kept — they're all validate.py needs. Lemma is
    NFC-normalised to match parser.py's normalisation.
    """
    log.info(f"Downloading {TOKENS_URL}")
    raw = urllib.request.urlopen(TOKENS_URL).read().decode("utf-8")
    rows = []
    for line in raw.splitlines():
        tid, _text, _form, _pos, _t1, _t2, lemma = line.split()
        rows.append(TokenRow(int(tid), unicodedata.normalize("NFC", lemma)))
    log.info(f"Parsed {len(rows)} token rows")
    return rows


def fetch_paragraphs() -> list[ParagraphRange]:
    """Download and parse jtauber's paragraphs.txt."""
    log.info(f"Downloading {PARAGRAPHS_URL}")
    raw = urllib.request.urlopen(PARAGRAPHS_URL).read().decode("utf-8")
    ranges = []
    for line in raw.splitlines():
        pid, start, end = line.split()
        ranges.append(ParagraphRange(int(pid), int(start), int(end)))
    log.info(f"Parsed {len(ranges)} paragraph ranges")
    return ranges

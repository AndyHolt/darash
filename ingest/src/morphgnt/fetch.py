import logging
import tarfile
import tempfile
import urllib.request
from pathlib import Path

from morphgnt.parser import Word, parse_morphgnt_book_file

log = logging.getLogger(__name__)

SBLGNT_TARBALL_URL = (
    "https://github.com/morphgnt/sblgnt/archive/refs/heads/master.tar.gz"
)
BOOK_FILE_GLOB = "sblgnt-master/??-*-morphgnt.txt"


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

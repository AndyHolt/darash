"""Fetch and parse the TAHOT source files.

The four book-range files live in the STEPBible-Data GitHub repo. For local
development they are pre-downloaded (gitignored) to ``tahot/data/``; if present
there they are used directly, otherwise they are downloaded to a temp dir. The
files are concatenated in canonical book order.
"""

import logging
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

from tahot.parser import Word, parse_tahot_file

log = logging.getLogger(__name__)

LOCAL_DATA_DIR = Path(__file__).parent / "data"

RAW_BASE = (
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/"
    "Translators Amalgamated OT+NT"
)

# In canonical (book) order, which is also the order they should be parsed in.
SOURCE_FILES = (
    "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
)


def fetch_and_parse() -> list[Word]:
    """Parse all four TAHOT files into Words, from local data or GitHub."""
    if _has_local_files():
        log.info(f"Using local TAHOT data in {LOCAL_DATA_DIR}")
        return _parse_dir(LOCAL_DATA_DIR)

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        for name in SOURCE_FILES:
            url = f"{RAW_BASE}/{urllib.parse.quote(name)}"
            dest = tmp / name
            log.info(f"Downloading {url}")
            urllib.request.urlretrieve(url, dest)
        return _parse_dir(tmp)


def _has_local_files() -> bool:
    return all((LOCAL_DATA_DIR / name).exists() for name in SOURCE_FILES)


def _parse_dir(directory: Path) -> list[Word]:
    all_words: list[Word] = []
    for name in SOURCE_FILES:
        words = parse_tahot_file(str(directory / name))
        log.info(f"Parsed {name[:13]}: {len(words)} words")
        all_words.extend(words)
    return all_words

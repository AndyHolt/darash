import logging
import tempfile
import urllib.request
from pathlib import Path

from tbesh.parser import Entry, parse_tbesh_file

log = logging.getLogger(__name__)

TBESH_URL = (
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/refs/heads/master/"
    "Lexicons/"
    "TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew"
    "%20-%20STEPBible.org%20CC%20BY.txt"
)


def fetch_and_parse() -> list[Entry]:
    """Download the TBESH lexicon and parse it into Entry objects."""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "tbesh.txt"

        log.info(f"Downloading {TBESH_URL}")
        urllib.request.urlretrieve(TBESH_URL, path)

        entries = parse_tbesh_file(str(path))
        log.info(f"Parsed {len(entries)} entries")
        return entries

import logging
import tempfile
import urllib.request
from pathlib import Path

from tbesg.parser import Entry, parse_tbesg_file

log = logging.getLogger(__name__)

TBESG_URL = (
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/refs/heads/master/"
    "Lexicons/"
    "TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek"
    "%20-%20STEPBible.org%20CC%20BY.txt"
)


def fetch_and_parse() -> list[Entry]:
    """Download the TBESG lexicon and parse it into Entry objects."""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "tbesg.txt"

        log.info(f"Downloading {TBESG_URL}")
        urllib.request.urlretrieve(TBESG_URL, path)

        entries = parse_tbesg_file(str(path))
        log.info(f"Parsed {len(entries)} entries")
        return entries

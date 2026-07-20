import logging
import sqlite3

from data_sqlite import atomic_writer
from tbesh.fetch import fetch_and_parse
from tbesh.parser import Entry
from tbesh.sqlite import load_entries as sqlite_load_entries

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_all(sqlite_conn: sqlite3.Connection) -> list[Entry]:
    """Fetch and parse the TBESH lexicon, load it into `sqlite_conn`, return it.

    The entries come back so the combined run can check TAHOT's Strong's tagging
    against them (see `main.py`); loading them alone needs no such check.
    """
    log.info("Fetching and parsing TBESH lexicon...")
    entries = fetch_and_parse()
    log.info(f"Parsed {len(entries)} entries")

    log.info("Loading entries into SQLite...")
    sqlite_load_entries(sqlite_conn, entries)
    return entries


def main() -> None:
    with atomic_writer() as conn:
        load_all(conn)
    log.info("Done")


if __name__ == "__main__":
    main()

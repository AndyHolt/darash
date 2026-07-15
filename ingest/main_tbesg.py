import logging
import sqlite3

from data_sqlite import atomic_writer
from tbesg.fetch import fetch_and_parse
from tbesg.sqlite import load_entries as sqlite_load_entries

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_all(sqlite_conn: sqlite3.Connection) -> None:
    """Fetch and parse the TBESG lexicon, then load it into `sqlite_conn`."""
    log.info("Fetching and parsing TBESG lexicon...")
    entries = fetch_and_parse()
    log.info(f"Parsed {len(entries)} entries")

    log.info("Loading entries into SQLite...")
    sqlite_load_entries(sqlite_conn, entries)


def main() -> None:
    with atomic_writer() as conn:
        load_all(conn)
    log.info("Done")


if __name__ == "__main__":
    main()

import logging
import sqlite3

from data_sqlite import atomic_writer
from tahot.fetch import fetch_and_parse
from tahot.parser import Word
from tahot.sqlite import load_words as sqlite_load_words
from tahot.stats import attach_stats

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_all(sqlite_conn: sqlite3.Connection) -> list[Word]:
    """Fetch and parse TAHOT, load it into `sqlite_conn`, and return the words.

    The words come back so the combined run can check their Strong's tagging
    against the TBESH lexicon (see `main.py`); loading TAHOT alone needs no such
    check, since the lexicon may not be in the database at all.
    """
    log.info("Fetching and parsing TAHOT...")
    words = fetch_and_parse()
    log.info(f"Parsed {len(words)} words from 39 books")

    log.info("Computing frequency stats...")
    attach_stats(words)

    log.info("Loading words into SQLite...")
    sqlite_load_words(sqlite_conn, words)
    return words


def main() -> None:
    with atomic_writer() as conn:
        load_all(conn)
    log.info("Done")


if __name__ == "__main__":
    main()

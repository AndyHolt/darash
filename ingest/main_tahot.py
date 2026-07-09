import logging
import sqlite3

from data_sqlite import atomic_writer
from tahot.db import connect as pg_connect
from tahot.db import load_words as pg_load_words
from tahot.fetch import fetch_and_parse
from tahot.sqlite import load_words as sqlite_load_words
from tahot.stats import attach_stats

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_all(sqlite_conn: sqlite3.Connection) -> None:
    """Fetch and parse TAHOT, then load it into Postgres and `sqlite_conn`."""
    log.info("Fetching and parsing TAHOT...")
    words = fetch_and_parse()
    log.info(f"Parsed {len(words)} words from 39 books")

    log.info("Computing frequency stats...")
    attach_stats(words)

    log.info("Loading words into Postgres...")
    conn = pg_connect()
    pg_load_words(conn, words)
    conn.close()

    log.info("Loading words into SQLite...")
    sqlite_load_words(sqlite_conn, words)


def main() -> None:
    with atomic_writer() as conn:
        load_all(conn)
    log.info("Done")


if __name__ == "__main__":
    main()

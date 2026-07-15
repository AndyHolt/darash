import logging
import sqlite3

from data_sqlite import atomic_writer
from morphgnt.fetch import fetch_and_parse, fetch_paragraphs, fetch_tokens
from morphgnt.paragraphs import assign_paragraphs
from morphgnt.sqlite import load_words as sqlite_load_words
from morphgnt.stats import attach_stats
from morphgnt.validate import validate_paragraphs, validate_tokens

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_all(sqlite_conn: sqlite3.Connection) -> None:
    """Fetch and parse MorphGNT, then load it into `sqlite_conn`."""
    log.info("Fetching and parsing MorphGNT SBLGNT...")
    words = fetch_and_parse()
    log.info(f"Parsed {len(words)} words from 27 books")

    log.info("Fetching vocabulary-tools alignment data...")
    tokens = fetch_tokens()
    paragraphs = fetch_paragraphs()

    log.info("Validating alignment...")
    validate_tokens(words, tokens)
    validate_paragraphs(paragraphs, len(words))

    log.info("Assigning paragraph ids...")
    assign_paragraphs(words, paragraphs)
    log.info(f"Assigned {len(paragraphs)} paragraphs across {len(words)} words")

    log.info("Computing frequency stats...")
    attach_stats(words)

    log.info("Loading words into SQLite...")
    sqlite_load_words(sqlite_conn, words)


def main() -> None:
    with atomic_writer() as conn:
        load_all(conn)
    log.info("Done")


if __name__ == "__main__":
    main()

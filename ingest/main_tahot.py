import logging

from tahot.db import connect, load_words
from tahot.fetch import fetch_and_parse
from tahot.stats import attach_stats

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    log.info("Fetching and parsing TAHOT...")
    words = fetch_and_parse()
    log.info(f"Parsed {len(words)} words from 39 books")

    log.info("Computing frequency stats...")
    attach_stats(words)

    log.info("Connecting to database...")
    conn = connect()

    log.info("Loading words into database...")
    load_words(conn, words)
    conn.close()
    log.info("Done")


if __name__ == "__main__":
    main()

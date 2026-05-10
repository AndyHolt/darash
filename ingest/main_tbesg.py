import logging

from tbesg.db import connect, ensure_schema, load_entries
from tbesg.fetch import fetch_and_parse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    log.info("Fetching and parsing TBESG lexicon...")
    entries = fetch_and_parse()
    log.info(f"Parsed {len(entries)} entries")

    log.info("Connecting to database...")
    conn = connect()
    ensure_schema(conn)

    log.info("Loading entries into database...")
    load_entries(conn, entries)
    conn.close()
    log.info("Done")


if __name__ == "__main__":
    main()

import logging

import main_morphgnt
import main_tahot
import main_tbesg
from data_sqlite import atomic_writer, target_path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    # One temp DB accumulates all three corpora and is atomically renamed into
    # place once, so data.sqlite is only replaced if the whole run succeeds.
    with atomic_writer() as conn:
        log.info("=== MorphGNT SBLGNT ===")
        main_morphgnt.load_all(conn)
        log.info("=== TAHOT ===")
        main_tahot.load_all(conn)
        log.info("=== TBESG lexicon ===")
        main_tbesg.load_all(conn)
    log.info(f"All ingest jobs complete; wrote {target_path()}")


if __name__ == "__main__":
    main()

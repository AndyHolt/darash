import logging

import main_morphgnt
import main_tahot
import main_tbesg
import main_tbesh
from data_sqlite import atomic_writer, target_path
from tbesh.validate import validate_coverage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    # One temp DB accumulates all four datasets and is atomically renamed into
    # place once, so data.sqlite is only replaced if the whole run succeeds.
    with atomic_writer() as conn:
        log.info("=== MorphGNT SBLGNT ===")
        main_morphgnt.load_all(conn)
        log.info("=== TAHOT ===")
        words = main_tahot.load_all(conn)
        log.info("=== TBESG lexicon ===")
        main_tbesg.load_all(conn)
        log.info("=== TBESH lexicon ===")
        entries = main_tbesh.load_all(conn)

        # Only the combined run holds both sides of the TAHOT↔TBESH join, so the
        # coverage check lives here rather than in either loader. It runs after
        # loading rather than before because everything so far has gone into the
        # temp DB — raising here discards it and leaves data.sqlite untouched.
        log.info("=== TAHOT lexicon coverage ===")
        validate_coverage(words, entries)
    log.info(f"All ingest jobs complete; wrote {target_path()}")


if __name__ == "__main__":
    main()

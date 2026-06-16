import logging

import main_morphgnt
import main_tahot
import main_tbesg

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    log.info("=== MorphGNT SBLGNT ===")
    main_morphgnt.main()
    log.info("=== TAHOT ===")
    main_tahot.main()
    log.info("=== TBESG lexicon ===")
    main_tbesg.main()
    log.info("All ingest jobs complete")


if __name__ == "__main__":
    main()

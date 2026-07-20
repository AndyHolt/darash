"""Validate that TAHOT's Strong's tagging is covered by the TBESH lexicon.

The two datasets are joined on the disambiguated Strong's number: TAHOT tags
every morpheme with one, and TBESH is keyed on it. Nothing enforces that from
either side, so this check quantifies the overlap and fails the ingest when it
drops — a re-tagged TAHOT release or a re-keyed lexicon would otherwise land
silently as words that quietly lose their definitions in the reading view.

Run after fetching but before loading: a drift in upstream sources fails the
ingest without replacing the existing data.

Coverage is measured over *tokens*, not distinct codes, so it reflects what a
reader actually meets on the page: one uncovered code on a common preposition
matters far more than a hundred on hapax proper nouns. At the time of writing the
measured figure is 99.93% (383 uncovered tokens of 540,467, across 21 codes), so
the floor sits at 99.5% — low enough not to trip on ordinary editorial churn,
tight enough to catch a structural break.
"""

import logging
from collections import Counter

from tahot.parser import Word
from tbesh.parser import Entry

log = logging.getLogger(__name__)

# The share of Strong's tokens that must resolve to a lexicon entry.
MINIMUM_COVERAGE = 0.995

# How many of the uncovered codes to name in the log.
_SAMPLE_SIZE = 10


class CoverageError(RuntimeError):
    """Raised when TAHOT's Strong's tagging outruns the TBESH lexicon."""


def validate_coverage(
    words: list[Word],
    entries: list[Entry],
    *,
    minimum: float = MINIMUM_COVERAGE,
) -> None:
    """Check that TAHOT segment Strong's numbers resolve to TBESH entries.

    Segments carrying no Strong's number at all (most punctuation) are not
    counted either way — they have nothing to look up.
    """
    keys = {e.dstrong() for e in entries}
    counts = Counter(s.strong for w in words for s in w.segments if s.strong)
    total = counts.total()
    if total == 0:
        raise CoverageError("no Strong's numbers found in the parsed TAHOT words")

    uncovered = Counter({k: v for k, v in counts.items() if k not in keys})
    coverage = (total - uncovered.total()) / total

    log.info(
        f"TBESH covers {coverage:.4%} of TAHOT Strong's tokens "
        f"({total - uncovered.total()}/{total}), "
        f"{len(counts) - len(uncovered)}/{len(counts)} distinct codes"
    )
    if uncovered:
        sample = ", ".join(
            f"{code} ({n})" for code, n in uncovered.most_common(_SAMPLE_SIZE)
        )
        log.warning(
            f"{len(uncovered)} Strong's codes have no TBESH entry "
            f"({uncovered.total()} tokens); most frequent: {sample}"
        )

    if coverage < minimum:
        raise CoverageError(
            f"TBESH covers only {coverage:.4%} of TAHOT Strong's tokens, "
            f"below the {minimum:.4%} floor"
        )

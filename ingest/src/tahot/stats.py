"""Compute frequency stats (count + rank) for surface forms and lemmas across
the parsed corpus, and attach them to each Word in place.

The lemma key is the root's disambiguated Strong's number (``root_strong``) —
the same key used to align to a Strong's-tagged lexicon. The surface form is the
full pointed Hebrew. Rank is ordinal (most frequent = 1); ties are broken by the
key itself so reruns produce identical ranks. Mirrors morphgnt.stats.
"""

from collections import Counter
from collections.abc import Callable

from tahot.parser import Word


def _count_and_rank(
    words: list[Word],
    key: Callable[[Word], str],
) -> tuple[Counter[str], dict[str, int]]:
    counts: Counter[str] = Counter(key(w) for w in words)
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    rank = {k: i + 1 for i, (k, _) in enumerate(ordered)}
    return counts, rank


def attach_stats(words: list[Word]) -> None:
    """Mutate each Word in-place, filling the four stats fields."""
    lemma_counts, lemma_rank = _count_and_rank(words, lambda w: w.root_strong)
    form_counts, form_rank = _count_and_rank(words, lambda w: w.hebrew)
    for w in words:
        w.lemma_count = lemma_counts[w.root_strong]
        w.lemma_rank = lemma_rank[w.root_strong]
        w.form_count = form_counts[w.hebrew]
        w.form_rank = form_rank[w.hebrew]

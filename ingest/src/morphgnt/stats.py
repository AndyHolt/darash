"""Compute frequency stats (count + rank) for normalized forms and lemmas
across the parsed corpus, and attach them to each Word in place.

Rank is ordinal: the most frequent key is 1, next is 2, etc. Ties are broken
by the key itself (lexicographic) so reruns produce identical ranks.
"""

from collections import Counter
from collections.abc import Callable

from morphgnt.parser import Word


def _count_and_rank(
    words: list[Word], key: Callable[[Word], str]
) -> tuple[Counter[str], dict[str, int]]:
    counts: Counter[str] = Counter(key(w) for w in words)
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    rank = {k: i + 1 for i, (k, _) in enumerate(ordered)}
    return counts, rank


def attach_stats(words: list[Word]) -> None:
    """Mutate each Word in-place, filling the four stats fields."""
    lemma_counts, lemma_rank = _count_and_rank(words, lambda w: w.lemma)
    form_counts, form_rank = _count_and_rank(words, lambda w: w.normalized)
    for w in words:
        w.lemma_count = lemma_counts[w.lemma]
        w.lemma_rank = lemma_rank[w.lemma]
        w.normalized_count = form_counts[w.normalized]
        w.normalized_rank = form_rank[w.normalized]

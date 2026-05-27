"""Assign a paragraph_id to each parsed Word in place.

Run after validate_paragraphs has confirmed the ranges are contiguous and
cover the corpus exactly — this function trusts that invariant and walks
words and ranges in lockstep.
"""

from morphgnt.fetch import ParagraphRange
from morphgnt.parser import Word


def assign_paragraphs(words: list[Word], paragraphs: list[ParagraphRange]) -> None:
    """Mutate each Word in-place, filling paragraph_id from its token position.

    Token position is 1-indexed (matching tokens.txt): the i-th word in the
    list has token_id i+1.
    """
    range_idx = 0
    current = paragraphs[range_idx]
    for i, word in enumerate(words):
        token_id = i + 1
        while token_id > current.end_token_id:
            range_idx += 1
            current = paragraphs[range_idx]
        word.paragraph_id = current.paragraph_id

"""Validate that parsed SBLGNT words align with jtauber's vocabulary-tools
data before loading into the database.

Run after fetching but before truncating: a drift in upstream sources fails
the ingest without destroying the existing rows.

Two checks:

1. Lemma alignment of parsed words against tokens.txt. Same count, same lemma
   at every position (NFC-normalised both sides). Surface-form drift between
   snapshots (accent shifts, movable-nu, editorial markers) is ignored —
   those don't affect token-id alignment. A lemma mismatch means either an
   insertion/deletion shifted every subsequent token, or a variant-reading
   swap replaced a word outright; either breaks alignment.

2. Paragraph ranges in paragraphs.txt are contiguous and cover 1..len(words)
   exactly.
"""

from morphgnt.fetch import ParagraphRange, TokenRow
from morphgnt.parser import Word


class AlignmentError(RuntimeError):
    """Raised when upstream sources have drifted out of alignment."""


def validate_tokens(words: list[Word], tokens: list[TokenRow]) -> None:
    """Check that parsed words align with tokens.txt by row count and lemma."""
    if len(words) != len(tokens):
        raise AlignmentError(
            f"row count mismatch: words={len(words)} tokens={len(tokens)}"
        )
    mismatches = [
        (i + 1, w.lemma, t.lemma)
        for i, (w, t) in enumerate(zip(words, tokens, strict=True))
        if w.lemma != t.lemma
    ]
    if mismatches:
        sample = "; ".join(
            f"pos={pos} word_lemma={wl!r} token_lemma={tl!r}"
            for pos, wl, tl in mismatches[:5]
        )
        raise AlignmentError(
            f"lemma mismatch in {len(mismatches)} positions (first 5: {sample})"
        )


def validate_paragraphs(paragraphs: list[ParagraphRange], n_words: int) -> None:
    """Check paragraph ranges are contiguous and cover 1..n_words exactly."""
    if not paragraphs:
        raise AlignmentError("paragraphs.txt is empty")
    for p in paragraphs:
        if p.end_token_id < p.start_token_id:
            raise AlignmentError(
                f"paragraph {p.paragraph_id} has end_token_id "
                f"{p.end_token_id} < start_token_id {p.start_token_id}"
            )
    if paragraphs[0].start_token_id != 1:
        raise AlignmentError(
            f"paragraphs.txt does not start at token 1 (got {paragraphs[0].start_token_id})"
        )
    if paragraphs[-1].end_token_id != n_words:
        raise AlignmentError(
            f"paragraphs.txt does not end at token {n_words} "
            f"(got {paragraphs[-1].end_token_id})"
        )
    for prev, curr in zip(paragraphs, paragraphs[1:]):
        if prev.end_token_id + 1 != curr.start_token_id:
            raise AlignmentError(
                f"non-contiguous paragraphs: {prev.paragraph_id} ends at "
                f"{prev.end_token_id}, {curr.paragraph_id} starts at "
                f"{curr.start_token_id}"
            )

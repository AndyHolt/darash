import pytest

from morphgnt.fetch import ParagraphRange, TokenRow
from morphgnt.parser import Word, parse_morphgnt_book_file
from morphgnt.validate import (
    AlignmentError,
    validate_paragraphs,
    validate_tokens,
)


def _make_words(tmp_path, lines: list[str]) -> list[Word]:
    book_file = tmp_path / "test.txt"
    book_file.write_text("\n".join(lines), encoding="utf-8")
    return parse_morphgnt_book_file(str(book_file))


def _matching_tokens(words: list[Word]) -> list[TokenRow]:
    return [TokenRow(i + 1, w.lemma) for i, w in enumerate(words)]


class TestValidateTokens:
    def test_happy_path(self, tmp_path):
        words = _make_words(
            tmp_path,
            [
                "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος",
                "010101 N- ----GSF- γενέσεως γενέσεως γενέσεως γένεσις",
            ],
        )
        validate_tokens(words, _matching_tokens(words))

    def test_row_count_mismatch_fails(self, tmp_path):
        words = _make_words(
            tmp_path,
            ["010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος"],
        )
        tokens = _matching_tokens(words) + [TokenRow(2, "ἄλλος")]
        with pytest.raises(AlignmentError, match="row count mismatch"):
            validate_tokens(words, tokens)

    def test_lemma_drift_fails(self, tmp_path):
        words = _make_words(
            tmp_path,
            [
                "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος",
                "010101 N- ----GSF- γενέσεως γενέσεως γενέσεως γένεσις",
            ],
        )
        tokens = _matching_tokens(words)
        # Simulate upstream variant-reading swap at position 2.
        tokens[1] = TokenRow(2, "ἕτερος")
        with pytest.raises(AlignmentError, match="lemma mismatch"):
            validate_tokens(words, tokens)


class TestValidateParagraphs:
    def test_happy_path(self):
        validate_paragraphs(
            [
                ParagraphRange(1001, 1, 8),
                ParagraphRange(1002, 9, 90),
                ParagraphRange(1003, 91, 100),
            ],
            n_words=100,
        )

    def test_empty_fails(self):
        with pytest.raises(AlignmentError, match="empty"):
            validate_paragraphs([], n_words=0)

    def test_does_not_start_at_1_fails(self):
        with pytest.raises(AlignmentError, match="does not start at token 1"):
            validate_paragraphs([ParagraphRange(1001, 2, 8)], n_words=8)

    def test_does_not_end_at_n_fails(self):
        with pytest.raises(AlignmentError, match="does not end at token 10"):
            validate_paragraphs([ParagraphRange(1001, 1, 8)], n_words=10)

    def test_non_contiguous_fails(self):
        with pytest.raises(AlignmentError, match="non-contiguous"):
            validate_paragraphs(
                [
                    ParagraphRange(1001, 1, 8),
                    ParagraphRange(1002, 10, 20),
                ],
                n_words=20,
            )

    def test_overlap_fails(self):
        with pytest.raises(AlignmentError, match="non-contiguous"):
            validate_paragraphs(
                [
                    ParagraphRange(1001, 1, 8),
                    ParagraphRange(1002, 8, 20),
                ],
                n_words=20,
            )

    def test_inverted_range_fails(self):
        with pytest.raises(AlignmentError, match="end_token_id"):
            validate_paragraphs(
                [
                    ParagraphRange(1001, 1, 8),
                    ParagraphRange(1002, 9, 7),
                ],
                n_words=8,
            )

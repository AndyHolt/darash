from morphgnt.parser import Word, parse_morphgnt_book_file
from morphgnt.stats import attach_stats


def _make_book_file(tmp_path, lines: list[str]):
    book_file = tmp_path / "test.txt"
    book_file.write_text("\n".join(lines), encoding="utf-8")
    return parse_morphgnt_book_file(str(book_file))


class TestAttachStats:
    def test_counts_and_ranks_for_lemma_and_normalized(self, tmp_path):
        # γεννάω appears 3 times (rank 1 lemma), βίβλος 2 times (rank 2),
        # Ἰησοῦς 1 time (rank 3 — broken by lexicographic order with any tie).
        # Normalized forms: ἐγέννησε(ν) ×3, βίβλος ×2, Ἰησοῦ ×1.
        words = _make_book_file(
            tmp_path,
            [
                "010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος",
                "010102 N- ----NSF- βίβλος, βίβλος βίβλος βίβλος",
                "010103 N- ----GSM- Ἰησοῦ Ἰησοῦ Ἰησοῦ Ἰησοῦς",
                "010104 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω",
                "010105 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω",
                "010106 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω",
            ],
        )

        attach_stats(words)

        by_lemma = {w.lemma: (w.lemma_count, w.lemma_rank) for w in words}
        assert by_lemma["γεννάω"] == (3, 1)
        assert by_lemma["βίβλος"] == (2, 2)
        assert by_lemma["Ἰησοῦς"] == (1, 3)

        by_form = {w.normalized: (w.normalized_count, w.normalized_rank) for w in words}
        assert by_form["ἐγέννησε(ν)"] == (3, 1)
        assert by_form["βίβλος"] == (2, 2)
        assert by_form["Ἰησοῦ"] == (1, 3)

    def test_ties_broken_deterministically_by_key(self):
        # Two lemmas with identical counts (1 each) — input ordering must not
        # affect the resulting ranks.
        alpha_line = "010101 N- ----NSF- ἄλφα ἄλφα ἄλφα ἄλφα"
        beta_line = "010102 N- ----NSF- βῆτα βῆτα βῆτα βῆτα"

        forward = [Word.from_line(alpha_line, 1), Word.from_line(beta_line, 1)]
        reverse = [Word.from_line(beta_line, 1), Word.from_line(alpha_line, 1)]
        attach_stats(forward)
        attach_stats(reverse)

        ranks_forward = {w.lemma: w.lemma_rank for w in forward}
        ranks_reverse = {w.lemma: w.lemma_rank for w in reverse}
        assert ranks_forward == ranks_reverse
        assert sorted(ranks_forward.values()) == [1, 2]

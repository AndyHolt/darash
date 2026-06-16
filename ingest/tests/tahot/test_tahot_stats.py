from tahot.books import Book
from tahot.parser import Word
from tahot.stats import attach_stats


def make_word(root_strong: str, hebrew: str) -> Word:
    return Word(
        book=Book.GENESIS,
        chapter=1,
        verse=1,
        word_index="01",
        hebrew_ref=None,
        text_type="L",
        variant_markers="",
        has_meaning_variant=False,
        hebrew=hebrew,
        transliteration="",
        translation="",
        grammar="",
        meaning_variants="",
        spelling_variants="",
        root_strong=root_strong,
        root_sstrong="",
        alt_strongs="",
        expanded_strongs="",
        segments=[],
    )


class TestAttachStats:
    def test_counts_and_ranks(self):
        # One lemma הָיָה (H1961) in two inflected forms — וַיְהִי ("and there
        # was") and יְהִי ("let there be") — plus a singleton טוֹב (H2896).
        words = [
            make_word("H1961", "וַיְהִי"),
            make_word("H1961", "וַיְהִי"),
            make_word("H1961", "יְהִי"),
            make_word("H2896", "טוֹב"),
        ]
        attach_stats(words)

        # Lemma is keyed on root_strong: H1961 occurs 3x (rank 1), H2896 1x (rank 2).
        assert words[0].lemma_count == 3
        assert words[0].lemma_rank == 1
        assert words[3].lemma_count == 1
        assert words[3].lemma_rank == 2

        # Form is keyed on the pointed Hebrew, independent of the lemma: the
        # same word has lemma_count 3 but form_count 2 (וַיְהִי 2x, יְהִי 1x).
        assert words[0].form_count == 2
        assert words[2].form_count == 1
        assert words[3].form_count == 1

    def test_ties_broken_deterministically_by_key(self):
        # Tied counts are the only case where rank could depend on input order;
        # the sort then falls back to the key. Two lemmas from Genesis 1:1, each
        # occurring twice, interleaved so that reversal is a real reordering.
        a = [
            make_word("H0776", "אֶרֶץ"),
            make_word("H8064", "שָׁמַיִם"),
            make_word("H0776", "אֶרֶץ"),
            make_word("H8064", "שָׁמַיִם"),
        ]
        attach_stats(a)
        b = list(reversed(a))
        attach_stats(b)

        # Reversal must not change any rank.
        assert {w.root_strong: w.lemma_rank for w in a} == {
            w.root_strong: w.lemma_rank for w in b
        }
        # Lemma tie broken by Strong's number: "H0776" < "H8064".
        assert (a[0].lemma_rank, a[1].lemma_rank) == (1, 2)
        # Form tie broken lexicographically: אֶרֶץ (alef) < שָׁמַיִם (shin).
        assert (a[0].form_rank, a[1].form_rank) == (1, 2)

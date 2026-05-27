from morphgnt.fetch import ParagraphRange
from morphgnt.paragraphs import assign_paragraphs
from morphgnt.parser import Word, parse_morphgnt_book_file


def _make_words(tmp_path, n: int) -> list[Word]:
    # Generate n minimal valid MorphGNT lines.
    lines = [
        f"01010{(i % 9) + 1} N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος" for i in range(n)
    ]
    book_file = tmp_path / "test.txt"
    book_file.write_text("\n".join(lines), encoding="utf-8")
    return parse_morphgnt_book_file(str(book_file))


class TestAssignParagraphs:
    def test_assigns_paragraph_to_every_word(self, tmp_path):
        words = _make_words(tmp_path, 10)
        paragraphs = [
            ParagraphRange(1001, 1, 3),
            ParagraphRange(1002, 4, 7),
            ParagraphRange(1003, 8, 10),
        ]
        assign_paragraphs(words, paragraphs)
        assert [w.paragraph_id for w in words] == [
            1001,
            1001,
            1001,
            1002,
            1002,
            1002,
            1002,
            1003,
            1003,
            1003,
        ]

    def test_single_paragraph_covers_all(self, tmp_path):
        words = _make_words(tmp_path, 5)
        assign_paragraphs(words, [ParagraphRange(99, 1, 5)])
        assert all(w.paragraph_id == 99 for w in words)

    def test_boundary_tokens_belong_to_their_paragraph(self, tmp_path):
        words = _make_words(tmp_path, 4)
        paragraphs = [
            ParagraphRange(1, 1, 1),  # only token 1
            ParagraphRange(2, 2, 3),  # tokens 2-3
            ParagraphRange(3, 4, 4),  # only token 4
        ]
        assign_paragraphs(words, paragraphs)
        assert [w.paragraph_id for w in words] == [1, 2, 2, 3]

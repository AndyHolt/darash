from enum import Enum


class Book(Enum):
    """The 39 books of the Hebrew Old Testament, in Protestant canonical order.

    `value` is the full English name (stored in the DB); `from_code` maps the
    3-letter abbreviation used in TAHOT references (e.g. `Gen`, `1Sa`, `Sng`).
    """

    GENESIS = "Genesis"
    EXODUS = "Exodus"
    LEVITICUS = "Leviticus"
    NUMBERS = "Numbers"
    DEUTERONOMY = "Deuteronomy"
    JOSHUA = "Joshua"
    JUDGES = "Judges"
    RUTH = "Ruth"
    FIRST_SAMUEL = "1 Samuel"
    SECOND_SAMUEL = "2 Samuel"
    FIRST_KINGS = "1 Kings"
    SECOND_KINGS = "2 Kings"
    FIRST_CHRONICLES = "1 Chronicles"
    SECOND_CHRONICLES = "2 Chronicles"
    EZRA = "Ezra"
    NEHEMIAH = "Nehemiah"
    ESTHER = "Esther"
    JOB = "Job"
    PSALMS = "Psalms"
    PROVERBS = "Proverbs"
    ECCLESIASTES = "Ecclesiastes"
    SONG_OF_SONGS = "Song of Songs"
    ISAIAH = "Isaiah"
    JEREMIAH = "Jeremiah"
    LAMENTATIONS = "Lamentations"
    EZEKIEL = "Ezekiel"
    DANIEL = "Daniel"
    HOSEA = "Hosea"
    JOEL = "Joel"
    AMOS = "Amos"
    OBADIAH = "Obadiah"
    JONAH = "Jonah"
    MICAH = "Micah"
    NAHUM = "Nahum"
    HABAKKUK = "Habakkuk"
    ZEPHANIAH = "Zephaniah"
    HAGGAI = "Haggai"
    ZECHARIAH = "Zechariah"
    MALACHI = "Malachi"

    @classmethod
    def from_code(cls, code: str) -> "Book":
        try:
            return _CODES[code]
        except KeyError:
            raise ValueError(f"Invalid book code: {code}") from None

    @property
    def order(self) -> int:
        """1-indexed canonical position, for deterministic sorting."""
        return ORDER.index(self) + 1


# Canonical order; also the order the four source files cover the books in.
ORDER: list[Book] = list(Book)

# 3-letter TAHOT reference abbreviation -> Book.
_CODES: dict[str, Book] = {
    "Gen": Book.GENESIS,
    "Exo": Book.EXODUS,
    "Lev": Book.LEVITICUS,
    "Num": Book.NUMBERS,
    "Deu": Book.DEUTERONOMY,
    "Jos": Book.JOSHUA,
    "Jdg": Book.JUDGES,
    "Rut": Book.RUTH,
    "1Sa": Book.FIRST_SAMUEL,
    "2Sa": Book.SECOND_SAMUEL,
    "1Ki": Book.FIRST_KINGS,
    "2Ki": Book.SECOND_KINGS,
    "1Ch": Book.FIRST_CHRONICLES,
    "2Ch": Book.SECOND_CHRONICLES,
    "Ezr": Book.EZRA,
    "Neh": Book.NEHEMIAH,
    "Est": Book.ESTHER,
    "Job": Book.JOB,
    "Psa": Book.PSALMS,
    "Pro": Book.PROVERBS,
    "Ecc": Book.ECCLESIASTES,
    "Sng": Book.SONG_OF_SONGS,
    "Isa": Book.ISAIAH,
    "Jer": Book.JEREMIAH,
    "Lam": Book.LAMENTATIONS,
    "Ezk": Book.EZEKIEL,
    "Dan": Book.DANIEL,
    "Hos": Book.HOSEA,
    "Jol": Book.JOEL,
    "Amo": Book.AMOS,
    "Oba": Book.OBADIAH,
    "Jon": Book.JONAH,
    "Mic": Book.MICAH,
    "Nam": Book.NAHUM,
    "Hab": Book.HABAKKUK,
    "Zep": Book.ZEPHANIAH,
    "Hag": Book.HAGGAI,
    "Zec": Book.ZECHARIAH,
    "Mal": Book.MALACHI,
}

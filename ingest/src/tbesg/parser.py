import re
import unicodedata
from dataclasses import dataclass

COLUMN_HEADER_PREFIX = "eStrong\tdStrong\tuStrong\t"
FORM_SEPARATORS = re.compile(r"[,=]")


@dataclass(frozen=True)
class Entry:
    """A single TBESG lexicon entry, stored verbatim from the source TSV."""

    extended_strong: str
    disambiguated_strong: str
    unified_strong: str
    greek: str
    transliteration: str
    morph: str
    gloss: str
    meaning: str

    def forms(self) -> list[str]:
        """Split the `greek` cell into individual lexical forms.

        Some entries list variant spellings as ``"α, Ἀλφα"``; others use ``=``
        to link related forms (e.g. ``"Ἑλληνιστί=Ἑλληνικός"``, where the
        dStrong column reads "a Spelling of"). Both halves of an ``=`` link
        belong in the form index so a lookup of either resolves to this entry.

        Fragments are stripped, empties dropped, and duplicates removed while
        preserving first-occurrence order — `greek` is already NFC-normalized,
        so string equality is the right dedupe key.
        """
        fragments = (s.strip() for s in FORM_SEPARATORS.split(self.greek))
        return list(dict.fromkeys(f for f in fragments if f))


def parse_tbesg_file(filename: str) -> list[Entry]:
    """Parse a TBESG TSV file into Entry objects.

    Skips the long preamble until the column-header row is seen, then the
    `=====` divider beneath it, then parses each subsequent non-blank line as
    8 tab-separated fields. Cells are not stripped — leading whitespace in the
    meaning column is intentional in the source.
    """
    entries: list[Entry] = []
    header_seen = False
    in_data = False

    with open(filename, "r", encoding="utf-8-sig") as f:
        for lineno, raw in enumerate(f, start=1):
            line = raw.rstrip("\n").rstrip("\r")

            if not header_seen:
                if line.startswith(COLUMN_HEADER_PREFIX):
                    header_seen = True
                continue

            if not in_data:
                if line.strip() == "" or line.startswith("="):
                    continue
                in_data = True

            if line.strip() == "":
                continue

            parts = line.split("\t")
            if len(parts) != 8:
                raise ValueError(
                    f"Malformed line {lineno}: expected 8 cols, got {len(parts)}"
                )

            # NFC-normalize Greek-bearing fields so lookups match other Greek
            # corpora (e.g. MorphGNT SBLGNT uses tonos; TBESG uses oxia — NFC
            # folds oxia → tonos for canonically-equivalent codepoints).
            parts[3] = unicodedata.normalize("NFC", parts[3])  # greek
            parts[7] = unicodedata.normalize("NFC", parts[7])  # meaning
            entries.append(Entry(*parts))

    if not header_seen:
        raise ValueError("TBESG column header not found")

    return entries

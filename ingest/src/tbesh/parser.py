"""Parse the TBESH Hebrew lexicon TSV into Entry objects.

TBESH is the Hebrew sibling of TBESG and ships in the same 8-column STEPBible
layout, so the file scan mirrors ``tbesg/parser.py``. The lookup key differs
though, and that difference is the point of this dataset: TAHOT tags every
morpheme with the disambiguated Strong's number this lexicon is keyed on, so
entries are found by ``dstrong()`` and there is no form index — no comma-split
variant spellings, no curated alias table.
"""

import unicodedata
from dataclasses import dataclass

# The data block opens with the same three Strong's columns as TBESG, but TBESH
# spells the first one "eStrong#" (TBESG has a bare "eStrong"), so the two files
# need their own header prefixes. All three columns are matched: the preamble's
# field-description list also has a line starting "eStrong#\t".
COLUMN_HEADER_PREFIX = "eStrong#\tdStrong\tuStrong\t"


@dataclass(frozen=True)
class Entry:
    """A single TBESH lexicon entry, stored verbatim from the source TSV."""

    extended_strong: str
    disambiguated_strong: str
    unified_strong: str
    hebrew: str
    transliteration: str
    morph: str
    gloss: str
    meaning: str

    def dstrong(self) -> str:
        """The disambiguated Strong's number this entry is keyed on.

        The source cell pairs the number with a relation phrase describing how it
        sits against the uStrong column — ``"H0001G ="`` for a plain entry,
        ``"H0002 = in Aramaic of"`` for a linked one. Only the left of the ``=``
        is the key, and it is unique across the whole lexicon.
        """
        return self.disambiguated_strong.split("=", 1)[0].strip()

    def relation(self) -> str:
        """The relation phrase from the dStrong cell, ``""`` when there is none.

        One of a small set: "in Aramaic of", "a Meaning of", "a Name of",
        "a Spelling of", "a group of", "a Part of", "a form of", "combination of",
        "in Hebrew of". It qualifies what the uStrong number links this entry to.
        """
        _, _, rest = self.disambiguated_strong.partition("=")
        return rest.strip()


def parse_tbesh_file(filename: str) -> list[Entry]:
    """Parse a TBESH TSV file into Entry objects.

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

            # NFC-normalize the Hebrew-bearing fields so pointed forms compare
            # equal to the TAHOT text, which is normalized the same way.
            parts[3] = unicodedata.normalize("NFC", parts[3])  # hebrew
            parts[7] = unicodedata.normalize("NFC", parts[7])  # meaning
            entries.append(Entry(*parts))

    if not header_seen:
        raise ValueError("TBESH column header not found")

    return entries

import csv
import unicodedata
from dataclasses import dataclass
from pathlib import Path

DEFAULT_PATH = Path(__file__).parent / "data" / "aligned_forms.csv"


@dataclass(frozen=True, slots=True)
class AlignedForm:
    """A manually-curated mapping from a morphgnt lemma to its tbesg form."""

    morphgnt: str
    tbesg: str


def load_aligned_forms(path: Path | None = None) -> list[AlignedForm]:
    """Return AlignedForm rows from the alignment CSV.

    Both columns are stripped and NFC-normalized to match the normalization
    applied to the `greek` field in `parser.py`, so lookups against
    `tbesg_lexicon_form.form` resolve correctly.
    """
    src = path if path is not None else DEFAULT_PATH
    aligned: list[AlignedForm] = []
    with open(src, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            morphgnt = unicodedata.normalize("NFC", (row["morphgnt"] or "").strip())
            tbesg = unicodedata.normalize("NFC", (row["tbesg"] or "").strip())
            if not morphgnt or not tbesg:
                continue
            aligned.append(AlignedForm(morphgnt=morphgnt, tbesg=tbesg))
    return aligned

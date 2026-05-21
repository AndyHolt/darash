import unicodedata

from tbesg.aliases import AlignedForm, load_aligned_forms


def write_csv(tmp_path, contents: str):
    path = tmp_path / "aligned_forms.csv"
    path.write_text(contents, encoding="utf-8")
    return path


def test_parses_basic_rows(tmp_path):
    path = write_csv(
        tmp_path,
        "morphgnt,tbesg\nαββα,ἀββά\nἍβελ,Ἄβελ\n",
    )

    aligned = load_aligned_forms(path)

    assert aligned == [
        AlignedForm(morphgnt="αββα", tbesg="ἀββά"),
        AlignedForm(morphgnt="Ἅβελ", tbesg="Ἄβελ"),
    ]


def test_strips_whitespace_and_skips_blank_rows(tmp_path):
    path = write_csv(
        tmp_path,
        "morphgnt,tbesg\nἀγαθουργέω,ἀγαθοεργέω \n,\n Ἅβελ , Ἄβελ \n",
    )

    aligned = load_aligned_forms(path)

    assert aligned == [
        AlignedForm(morphgnt="ἀγαθουργέω", tbesg="ἀγαθοεργέω"),
        AlignedForm(morphgnt="Ἅβελ", tbesg="Ἄβελ"),
    ]


def test_nfc_normalizes_both_columns(tmp_path):
    nfd_morphgnt = unicodedata.normalize("NFD", "Ἅβελ")
    nfd_tbesg = unicodedata.normalize("NFD", "Ἄβελ")
    assert nfd_morphgnt != "Ἅβελ"

    path = write_csv(tmp_path, f"morphgnt,tbesg\n{nfd_morphgnt},{nfd_tbesg}\n")

    aligned = load_aligned_forms(path)

    assert aligned == [AlignedForm(morphgnt="Ἅβελ", tbesg="Ἄβελ")]

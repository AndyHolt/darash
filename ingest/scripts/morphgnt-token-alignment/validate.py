"""Validate that morphgnt_sblgnt.id aligns 1:1 with vocabulary-tools token IDs.

Both data sets derive from github.com/morphgnt/sblgnt, so if the ingest
pipeline loaded books in canonical order they should match exactly. A pass
means we can join jtauber's paragraphs.txt (and sentences/pericopes) into
morphgnt_sblgnt by id without an intermediate token_id column.

We compare on (id, lemma) only. Lemma is the right signal:

- Same lemma, different surface form (accent shifts, movable-nu, editorial
  markers, NFC quirks) means it's still the same word at that token id, so
  paragraph alignment is intact. Ignore.
- Different lemma at the same id means either an insertion/deletion shifted
  every subsequent token by one, or a variant-reading swap replaced the word
  outright. Either breaks alignment. Fail loudly.

`text` is fetched too but only for diagnostic output on mismatch.

Run from repo root:
    cd ingest && PYTHONPATH=src uv run python scripts/morphgnt-token-alignment/validate.py

Requires PG* env vars (loaded by `make` from .env; export manually if running
outside make).
"""

import unicodedata
import urllib.request

from morphgnt.db import connect

TOKENS_URL = "https://raw.githubusercontent.com/jtauber/vocabulary-tools/master/gnt_data/tokens.txt"


def fetch_tokens() -> list[tuple[int, str, str]]:
    """Return [(token_id, text, lemma)] in token-id order, NFC-normalised."""
    raw = urllib.request.urlopen(TOKENS_URL).read().decode("utf-8")
    tokens = []
    for line in raw.splitlines():
        tid, text, _form, _pos, _t1, _t2, lemma = line.split()
        tokens.append(
            (
                int(tid),
                unicodedata.normalize("NFC", text),
                unicodedata.normalize("NFC", lemma),
            )
        )
    return tokens


def fetch_rows() -> list[tuple[int, str, str]]:
    """Return [(id, text, lemma)] from morphgnt_sblgnt ordered by id."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, text, lemma FROM morphgnt_sblgnt ORDER BY id")
        return cur.fetchall()


def main() -> None:
    print(f"Fetching {TOKENS_URL}")
    tokens = fetch_tokens()
    print(f"  {len(tokens)} tokens")

    print("Reading morphgnt_sblgnt")
    rows = fetch_rows()
    print(f"  {len(rows)} rows")

    if len(rows) != len(tokens):
        print(f"FAIL: row count mismatch (db={len(rows)} tokens={len(tokens)})")
        return

    mismatches = [
        (r, t)
        for r, t in zip(rows, tokens, strict=True)
        if (r[0], r[2]) != (t[0], t[2])
    ]
    print(f"Lemma mismatches: {len(mismatches)}")
    for (rid, rtext, rlemma), (tid, ttext, tlemma) in mismatches[:20]:
        print(f"  id={rid}  db=({rtext!r}, {rlemma!r})  token=({ttext!r}, {tlemma!r})")

    if not mismatches:
        print("PASS: morphgnt_sblgnt.id aligns 1:1 with vocabulary-tools token_id")


if __name__ == "__main__":
    main()

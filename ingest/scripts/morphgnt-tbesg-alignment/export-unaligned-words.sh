#!/usr/bin/env bash
# Export MorphGNT lemmas that don't match any tbesg_lexicon_form entry
# to unaligned_words_morphgnt_tbesg.csv on the host.
#
# Reads the local data.sqlite produced by an ingest run (`make ingest-run`);
# override its location with DATA_SQLITE_PATH.

set -euo pipefail

INGEST="$(cd "$(dirname "$0")/../.." && pwd)"
DATA_SQLITE="${DATA_SQLITE_PATH:-$INGEST/data.sqlite}"

sqlite3 -csv -header "$DATA_SQLITE" "
  SELECT m.lemma AS unmatched_lemma, m.book, m.chapter, m.verse, m.word_index
  FROM morphgnt_sblgnt m
  LEFT JOIN tbesg_lexicon_form f ON m.lemma = f.form
  WHERE f.form IS NULL
  ORDER BY m.lemma, m.book, m.chapter, m.verse, m.word_index
" > "$INGEST/unaligned_words_morphgnt_tbesg.csv"

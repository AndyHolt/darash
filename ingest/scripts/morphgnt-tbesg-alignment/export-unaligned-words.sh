#!/usr/bin/env bash
# Export MorphGNT lemmas that don't match any tbesg_lexicon_form entry
# to unaligned_words_morphgnt_tbesg.csv on the host.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

set -a
# shellcheck disable=SC1091
. "$ROOT/.env"
set +a

docker compose -f "$ROOT/infra/dev/docker-compose.yml" exec -T postgres \
  psql -U "$PGUSER" -d "$PGDATABASE" -c "\copy (
    SELECT m.lemma AS unmatched_lemma, m.book, m.chapter, m.verse, m.word_index
    FROM morphgnt_sblgnt m
    LEFT JOIN tbesg_lexicon_form f ON m.lemma = f.form
    WHERE f.form IS NULL
    ORDER BY m.lemma, m.book, m.chapter, m.verse, m.word_index
  ) TO STDOUT WITH CSV HEADER" \
  > "$ROOT/unaligned_words_morphgnt_tbesg.csv"

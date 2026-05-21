COPY (
  SELECT unmatched_lemma as morphgnt, "tbesg form" as tbesg
  FROM read_csv_auto('morphgnt_tbesg_missing_alignments.csv')
  WHERE "tbesg form" IS NOT NULL
) TO 'aligned_words.csv'
WITH (FORMAT CSV, HEADER TRUE);

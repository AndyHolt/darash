pre-commit: prek
prek:
	prek

ingest_tests:
	cd ingest && uv run pytest

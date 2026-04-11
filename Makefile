pre-commit: prek
prek:
	prek

ingest_tests:
	cd ingest && uv run pytest

db-up:
	docker compose -f infra/dev/docker-compose.yml up -d

db-down:
	docker compose -f infra/dev/docker-compose.yml down

db-psql:
	docker compose -f infra/dev/docker-compose.yml exec postgres psql -U darash -d darash

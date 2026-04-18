# Load PG* connection vars from .env if it exists. The `-` prefix means make
# won't error when the file is absent (e.g. in CI where env vars are set
# externally). `export` makes all variables available to recipe subprocesses.
# Note: this exports everything in .env (including PGPASSWORD) to ALL targets.
# If a future target should not have access to these, source .env per-target
# instead.
-include .env
export

.PHONY: pre-commit prek ingest_tests ingest _require-env db-up db-down db-psql backend-up backend-down backend-dev

pre-commit: prek
prek:
	prek

ingest_tests:
	cd ingest && uv run pytest

ingest:
	cd ingest && PYTHONPATH=src uv run python main.py

# db-* targets are for local dev and require .env to exist.
_require-env:
	@test -f .env || (echo "error: .env not found — copy .env.example to .env" && exit 1)

db-up: _require-env
	docker compose -f infra/dev/docker-compose.yml up -d

db-down: _require-env
	docker compose -f infra/dev/docker-compose.yml down

db-psql: _require-env
	docker compose -f infra/dev/docker-compose.yml exec postgres psql -U "$$PGUSER" -d "$$PGDATABASE"

backend-up: _require-env
	docker compose -f infra/dev/docker-compose.yml --profile backend up -d --build

backend-down: _require-env
	docker compose -f infra/dev/docker-compose.yml --profile backend down

backend-dev: _require-env
	cd backend && DB_HOST=localhost DB_PORT=$$PGPORT DB_NAME=$$PGDATABASE \
		DB_USER=$$PGUSER DB_PASSWORD=$$PGPASSWORD DB_SSLMODE=disable air

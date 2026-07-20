.PHONY: pre-commit prek \
	ingest-run ingest-morphgnt-run ingest-tahot-run ingest-tbesg-run ingest-tbesh-run ingest-tests \
	backend-dev backend-tests \
	frontend-install frontend-dev frontend-build frontend-check frontend-typecheck frontend-tests frontend-preview

pre-commit: prek
prek:
	prek

# Local-dev SQLite file: written by the ingest targets below and served by
# backend-dev. Defined once here so the producer and consumer can't drift. (CI's
# deploy workflow sets DATA_SQLITE_PATH itself to bake the file into the image.)
DATA_SQLITE := $(CURDIR)/ingest/data.sqlite

ingest-run:
	cd ingest && DATA_SQLITE_PATH=$(DATA_SQLITE) PYTHONPATH=src uv run python main.py

ingest-morphgnt-run:
	cd ingest && DATA_SQLITE_PATH=$(DATA_SQLITE) PYTHONPATH=src uv run python main_morphgnt.py

ingest-tahot-run:
	cd ingest && DATA_SQLITE_PATH=$(DATA_SQLITE) PYTHONPATH=src uv run python main_tahot.py

ingest-tbesg-run:
	cd ingest && DATA_SQLITE_PATH=$(DATA_SQLITE) PYTHONPATH=src uv run python main_tbesg.py

ingest-tbesh-run:
	cd ingest && DATA_SQLITE_PATH=$(DATA_SQLITE) PYTHONPATH=src uv run python main_tbesh.py

# Rebuild the db when any ingest source is newer than it (or it is missing), so
# editing a loader and running `make backend-dev` picks the change up. The corpus
# data is fetched from the network at ingest time, so make can't see *it* change —
# force a re-fetch with `make ingest-run`.
INGEST_SRC := $(shell find ingest/src -name '*.py') $(wildcard ingest/main*.py)

$(DATA_SQLITE): $(INGEST_SRC)
	$(MAKE) ingest-run

ingest-tests:
	cd ingest && uv run pytest

# Serve from the local data.sqlite, building it first if it is missing.
# LOG_LEVEL=debug surfaces request logs; air gives live reload.
backend-dev: $(DATA_SQLITE)
	cd backend && DATA_DB_PATH=$(DATA_SQLITE) LOG_LEVEL=debug air

backend-tests:
	cd backend && go test ./...

frontend-install:
	cd frontend && pnpm install

frontend-dev:
	cd frontend && pnpm dev

frontend-build:
	cd frontend && pnpm build

frontend-check:
	cd frontend && pnpm check

frontend-typecheck:
	cd frontend && pnpm typecheck

frontend-tests:
	cd frontend && pnpm test

frontend-preview:
	cd frontend && pnpm preview

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Darash is a Biblical Greek study app. The data pipeline loads the MorphGNT
SBLGNT (morphologically tagged Greek New Testament) into Postgres, a Go
backend exposes it over HTTP, and a React/Vite frontend consumes the API.

The repo is a monorepo with four top-level code areas:

- `ingest/` — Python (>=3.14, uv-managed) job that fetches and parses the
  MorphGNT SBLGNT source files into typed dataclasses and bulk-loads them into
  Postgres via `COPY ... FROM STDIN`. Runs on a schedule/manually via
  `ingest-prod.yml`, not from within the app.
- `backend/` — Go HTTP server (`net/http`, `pgx/v5`). Layered as
  handler → service → store (`morphgnt_handler.go` → `morphgnt_service.go` →
  `morphgnt_store.go`), with `Repository` interface defined at the service
  layer so the store is pluggable. `db.go` builds the pgx pool and picks a
  TLS mode based on `DB_SSLMODE` (`verify-full` loads an RDS CA bundle from
  `/etc/ssl/certs/rds-ca.pem`; `disable` is for local dev).
- `frontend/` — React 19 + Vite + TanStack Router (file-based routes in
  `src/routes/`) + TanStack Query. shadcn/ui components under
  `src/components/ui/`. Tailwind v4 via the Vite plugin. Dev server proxies
  `/api/*` to `http://localhost:8080` (see `vite.config.ts`). In production,
  the CloudFront distribution proxies `/api/*` to the ALB, so the frontend
  always calls same-origin `/api/...` — never hardcode the API URL.
- `infra/` + `bootstrap/` — Terraform. `bootstrap/` is applied locally once
  and creates the S3 state bucket, OIDC provider, and the CI role that
  `infra/` then uses. `infra/` runs via the `terraform-apply` workflow. See
  README.md for the bootstrap dance and the manual Cloudflare DNS / ACM steps
  that Terraform doesn't automate.

## Common commands

All via the root `Makefile` (which auto-loads `.env`). `.env` must exist for
`db-*` and `backend-*` targets — copy from `.env.example`.

**Local dev loop:**
```
make db-up             # start Postgres via docker-compose
make backend-dev       # run backend with air (live reload); uses .env PG* vars
make frontend-dev      # pnpm dev (Vite on :5173 by default)
make db-psql           # psql into the running container
```

Run the ingest job against the DB pointed to by `PG*` env vars:
```
make ingest-run        # cd ingest && PYTHONPATH=src uv run python main.py
```

**Checks / CI-equivalent:**
```
make pre-commit        # runs `prek` (pre-commit drop-in) across the repo
make frontend-check    # biome check .
make frontend-typecheck # tsc -b
make frontend-build    # tsc -b && vite build
make ingest-tests      # cd ingest && uv run pytest
make backend-tests     # cd backend && go test ./...
```
Run a single Python test: `cd ingest && uv run pytest tests/morphgnt/test_parser.py::test_name`.

Backend: no test suite yet. Lint/format hooks (`gofmt`, `go vet`, `go mod
tidy`, `golangci-lint`) live in `backend/.pre-commit-config.yaml` and run via
`prek`. `golangci-lint run` from inside `backend/` runs it directly.

**Backend in Docker (optional):** `make backend-up` / `make backend-down`
runs the backend container against the dockerised Postgres.

## Architecture notes worth knowing up front

- **Database schema is owned by ingest, not the backend.** `ingest/src/morphgnt/db.py::SCHEMA_SQL` is the source of truth for the `morphgnt_sblgnt` table. The backend reads from it but does not migrate it. `load_words` TRUNCATEs and reloads inside a single transaction — the table is treated as a rebuildable projection of the MorphGNT source, not a mutable store.
- **Secrets and env vars.** Root `.env` defines `PGUSER/PGPASSWORD/PGDATABASE/PGPORT/PGHOST` and is loaded by `make` into every recipe. The backend reads a different set of names (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE`, `PORT`) — the Makefile's `backend-dev` target translates between them. In prod, ECS injects `DB_PASSWORD` from Secrets Manager and `DB_SSLMODE=verify-full` is used.
- **Frontend data fetching.** Routes use the TanStack Router `loader` + TanStack Query `ensureQueryData` pattern (see `routes/count.tsx`) so data is prefetched during route transition and components use `useSuspenseQuery`. Follow this pattern for new data-backed routes rather than doing `useEffect`/`useQuery` in the component body.
- **Deployment topology.** Frontend → S3 behind CloudFront (deployed by `frontend-deploy.yml`, invalidated on push). Backend → ECR image → ECS Fargate behind an ALB (deployed by `backend-deploy.yml`). Postgres → RDS. DNS for `darashbible.com` is in Cloudflare (grey-cloud CNAMEs to CloudFront and the ALB) — not Route53. See README.md for the rollback command if a backend deploy goes bad.

## Conventions

- Never commit directly to `main` — the `no-commit-to-branch` pre-commit hook blocks it; changes go through PRs (workflows run on `push` to any branch).
- Frontend uses **pnpm**, not npm. CI installs with `pnpm install` and the lockfile is `pnpm-lock.yaml`; don't run `npm install` in `frontend/` — it would create a conflicting `package-lock.json` and can resolve deps differently under npm's hoisted layout vs pnpm's symlinked one.
- Frontend uses Biome (not Prettier/ESLint-only) — `biome.json` sets double quotes, 2-space indent, line width 100. `routeTree.gen.ts` is generated and excluded.
- Go imports use the standard `gofmt -s` layout; `golangci-lint` runs with default config (no `.golangci.yml`).
- Python: `ruff` and `ty` (Astral's type checker) are dev deps in `ingest/pyproject.toml`. Tests live in `ingest/tests/` with `pythonpath = ["src"]` so imports are `from morphgnt.x import ...`.

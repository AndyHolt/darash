# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Darash is a Biblical Greek study app. The data pipeline loads the MorphGNT
SBLGNT (morphologically tagged Greek New Testament) into a SQLite file, a Go
backend exposes it over HTTP, and a React/Vite frontend consumes the API.

The repo is a monorepo with four top-level code areas:

- `ingest/` — Python (>=3.14, uv-managed) job that fetches and parses the
  MorphGNT SBLGNT source files into typed dataclasses and writes them into a
  SQLite file (`data.sqlite`), built at a temp path and atomically renamed into
  place. The data reaches production by being baked into the backend image
  during `backend-deploy`, not from within the app.
- `backend/` — Go HTTP server (`net/http`, `database/sql` +
  `modernc.org/sqlite` — the pure-Go driver, so the binary stays static).
  Layered as handler → service → store
  (`internal/morphgnt/{handler,service,store}.go`), with the `Repository`
  interface defined at the service layer so the store is pluggable.
  `internal/sqlite/sqlite.go`'s `Open` opens the DB read-only, applying the
  `query_only` and `mmap_size` pragmas through the DSN. In prod it runs as a
  Lambda via the AWS Lambda Web Adapter (so the `net/http` mux is unchanged),
  serving a `data.sqlite` baked into the image; `main.go` reads the file's path
  from `DATA_DB_PATH` (no compiled-in default).
- `frontend/` — React 19 + Vite + TanStack Router (file-based routes in
  `src/routes/`) + TanStack Query. shadcn/ui components under
  `src/components/ui/`. Tailwind v4 via the Vite plugin. Dev server proxies
  `/api/*` to `http://localhost:8080` (see `vite.config.ts`). In production,
  the CloudFront distribution proxies `/api/*` to the backend Lambda's Function
  URL, so the frontend always calls same-origin `/api/...` — never hardcode the
  API URL.
- `infra/` + `bootstrap/` — Terraform. `bootstrap/` is applied locally once
  and creates the S3 state bucket, OIDC provider, and the CI role that
  `infra/` then uses. `infra/` runs via the `infra-deploy.yml` workflow. See
  README.md for the bootstrap dance and the manual Cloudflare DNS / ACM steps
  that Terraform doesn't automate.

## Common commands

All via the root `Makefile`.

**Local dev loop:**
```
make backend-dev       # build data.sqlite if needed, then run backend with air (live reload)
make frontend-dev      # pnpm dev (Vite on :5173 by default)
```

`backend-dev` builds `ingest/data.sqlite` on demand (when a loader is newer than
the file, or it is missing). Run ingest explicitly to re-fetch the source data:
```
make ingest-run        # writes ingest/data.sqlite
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

## Architecture notes worth knowing up front

- **Database schema is owned by ingest, not the backend.** `ingest/src/morphgnt/sqlite.py::SCHEMA_SQL` is the source of truth for the `morphgnt_sblgnt` table (and the tahot/tbesg `sqlite.py` modules for their tables). The backend reads `data.sqlite` but does not migrate it. Each loader does `DROP`+`CREATE`+bulk-insert, and the run builds into a temp file atomically renamed into place — the DB is a rebuildable projection of the source, not a mutable store. The backend's store tests duplicate the DDL in `internal/sqlite/sqlitetest`; keeping that copy in step with ingest is manual discipline, not an automated check.
- **Env vars.** The backend reads `DATA_DB_PATH` (the SQLite file to serve — no compiled-in default, so it must be set), plus `PORT` and `LOG_LEVEL`. In prod the image's `ENV DATA_DB_PATH=/data.sqlite` supplies it; `make backend-dev` passes the local `ingest/data.sqlite` path. There are no database credentials or secrets — the data is a static file baked into the image.
- **Frontend data fetching.** Routes use the TanStack Router `loader` + TanStack Query `ensureQueryData` pattern (see `routes/count.tsx`) so data is prefetched during route transition and components use `useSuspenseQuery`. Follow this pattern for new data-backed routes rather than doing `useEffect`/`useQuery` in the component body.
- **Deployment topology.** Frontend → S3 behind CloudFront (deployed by `frontend-deploy.yml`, invalidated on push). Backend → ECR image → Lambda behind a Function URL (deployed by `backend-deploy.yml`, which bakes `data.sqlite` into the image); the same CloudFront distribution signs `/api/*` origin requests (OAC) and forwards them to the Function URL. No RDS/ECS/ALB. DNS for `darashbible.com` is in Cloudflare (grey-cloud CNAME to CloudFront) — not Route53. See README.md for the rollback command if a backend deploy goes bad.

## Conventions

- Never commit directly to `main` — the `no-commit-to-branch` pre-commit hook blocks it; changes go through PRs (workflows run on `push` to any branch).
- Frontend uses **pnpm**, not npm. CI installs with `pnpm install` and the lockfile is `pnpm-lock.yaml`; don't run `npm install` in `frontend/` — it would create a conflicting `package-lock.json` and can resolve deps differently under npm's hoisted layout vs pnpm's symlinked one.
- Frontend uses Biome (not Prettier/ESLint-only) — `biome.json` sets double quotes, 2-space indent, line width 100. `routeTree.gen.ts` is generated and excluded.
- Go imports use the standard `gofmt -s` layout; `golangci-lint` runs with default config (no `.golangci.yml`).
- Python: `ruff` and `ty` (Astral's type checker) are dev deps in `ingest/pyproject.toml`. Tests live in `ingest/tests/` with `pythonpath = ["src"]` so imports are `from morphgnt.x import ...`.

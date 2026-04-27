---
name: branch-review
description: Review the pending changes on the current branch (or a named PR) against the conventions and architecture of the Darash monorepo. Tailors the review to the parts of the repo touched (ingest, backend, frontend, infra) and includes idiomatic-usage feedback for Go, React, Terraform, and AWS as a learning aid. Use when the user asks for a code review, branch review, PR review, or "review my changes".
allowed-tools: Bash(git diff *) Bash(gh pr diff *) Bash(gh pr view *) Read Grep Glob
---

# Branch review

Review the pending changes on the current branch with monorepo-aware guidance. The repo has four code areas (`ingest/`, `backend/`, `frontend/`, `infra/` + `bootstrap/`) — review only the areas that have changed, and apply the relevant guidance below.

This project is partly a learning vehicle for the tech stack (Go, React, Terraform, AWS). Reviews should therefore go beyond correctness and convention, and call out **idiomatic-usage** opportunities: places where the code works but diverges from standard practice in the language/framework, or where a more idiomatic pattern would improve the code. See the "Idiomatic usage" section below.

## Workflow

### 1. Determine the diff

If the user supplied a PR number, fetch it:

```bash
gh pr view <num> --json baseRefName,headRefName,files,title,body
gh pr diff <num>
```

Otherwise diff the current branch against `main`:

```bash
git fetch origin main --quiet
git diff --stat origin/main...HEAD
git diff origin/main...HEAD
git log origin/main..HEAD --oneline
```

Read the full diff, not just the stat. For large diffs, focus on logic files first and skim generated/lock files (see "What to ignore" below).

### 2. Categorize changed files

Bucket each changed file by area:

- `ingest/**` → ingest section
- `backend/**` → backend section
- `frontend/**` → frontend section
- `infra/**`, `bootstrap/**` → infra section
- `.github/workflows/**` → CI section
- root config (`Makefile`, `docker-compose.yml`, root `.env.example`, `README.md`, `CLAUDE.md`) → cross-cutting section

If a change spans areas (e.g. a new field in ingest's schema, backend Word struct, and frontend types), call that out explicitly and check the three are consistent.

### 3. Apply the relevant section(s) below, then report

Report findings as a structured review:
- **Blocking** — correctness, security, broken invariants, anything that should not merge.
- **Should-fix** — convention violations, missing tests, unclear code that will rot.
- **Nits** — style, naming, optional improvements. Mark as nits so the user can ignore freely.
- **Idiomatic usage / learning notes** — places where the code works but diverges from idiomatic Go/React/Terraform/AWS, or where a standard pattern would improve it. Frame these as teaching points: name the pattern, show a brief sketch, explain *why* it's preferred (not just that it is). These are advisory, not blocking.
- **Praise** — non-obvious choices that were done well. Keep brief but include them — silence on good work skews the review negative.

Cite `file:line` for every point. Do not paraphrase the diff back at the user — they wrote it. Lead with the issue.

---

## Cross-cutting checks (always apply)

- **Secrets / credentials.** No `.env`, `*.pem`, AWS keys, DB passwords, or API tokens in the diff. Check string literals that look like tokens.
- **`main` not committed to directly.** The branch should not be `main`. The `no-commit-to-branch` pre-commit hook should have caught this, but verify.
- **Generated files match source.** If `frontend/src/routeTree.gen.ts` changed, a route file should also have changed. If `pnpm-lock.yaml` changed, `package.json` should too. Mismatches usually mean a hand-edit.
- **Test coverage for new logic.** Check every diff against this rule, not just ones that look risky. For each new chunk of logic, ask: *does this have a corresponding test, and if not, why not?* A finding here names the specific function/handler/parser and the file the test should live in. Match the area's existing test conventions — don't prescribe a framework the area doesn't already use.
  - **Needs tests** (flag missing tests as **should-fix**, or **blocking** if the logic is non-trivial and untested): new handlers, services, stores; new parsers, validators, formatters; pure functions with branching logic; hooks or modules that transform data; anywhere an `if/else`, loop, or error branch is introduced that isn't already covered.
  - **Doesn't need new tests** (do not flag): pure refactors with no behaviour change (existing tests must still pass); type-only additions, JSON-tag tweaks, comment/doc changes; display-only components and thin route shells over a query; generated files, config, lockfiles.
  - **Edge cases worth a specific test, not just a happy-path one:** error branches (e.g. 400 vs 500 in HTTP handlers), boundary values in parsers (off-by-one on counts/lengths), nil/optional paths, and any new conditional that isn't covered by an existing case.
  - **If an area has no test infrastructure yet** but the diff introduces non-trivial logic that warrants tests, flag the absence of infrastructure itself as a should-fix rather than treating the area as exempt.
- **Cross-area consistency.** When a field is added to the MorphGNT word data, check all three: `ingest/src/morphgnt/db.py::SCHEMA_SQL` (source of truth), `backend/morphgnt.go::Word`, and `frontend/src/texts/morphgnt/morphgnt.types.ts`. JSON tags must be snake_case end-to-end (the frontend matches wire format verbatim per the project's chosen convention).

## What to ignore (do not flag)

- `frontend/src/routeTree.gen.ts` — generated by TanStack Router.
- `pnpm-lock.yaml`, `go.sum`, `uv.lock` — lockfile churn.
- Whitespace-only changes inside files that are otherwise unchanged.

---

## Ingest (`ingest/**`)

Python ≥ 3.14, uv-managed. Tests in `ingest/tests/` with `pythonpath = ["src"]` so imports are `from morphgnt.x import ...`. `ruff` and `ty` (Astral's type checker) are dev deps.

**Check for:**

- **Schema changes.** `SCHEMA_SQL` in `ingest/src/morphgnt/db.py` is the source of truth for the `morphgnt_sblgnt` table. Any column change here is a breaking change for the backend — verify `backend/morphgnt_store.go` reads the new shape and that the backend's `Word` struct is updated. The table is TRUNCATE+reload inside a transaction, so migrations are not needed, but a deploy ordering question exists: ingest must run after the backend understands the new column, *or* the backend must tolerate the old shape until ingest catches up.
- **`COPY ... FROM STDIN` correctness.** Column order in the COPY call must match column order in `SCHEMA_SQL`. Misalignment silently corrupts data.
- **Type annotations.** New code should be typed; `ty` runs in pre-commit.
- **Error handling at fetch boundaries.** `fetch.py` talks to the MorphGNT remote — network failures and partial reads should fail loudly, not produce empty/partial loads.
- **Tests.** New parsing logic needs a test in `ingest/tests/morphgnt/`. Tests should not require a live database — DB code is tested with a real Postgres in pre-commit, parsing logic with fixtures.

## Backend (`backend/**`)

Go, `net/http` + `pgx/v5`. Layered: handler → service → store. `Repository` interface defined at the service layer. `golangci-lint`, `gofmt`, `go vet`, `go mod tidy` run via pre-commit.

**Check for:**

- **Layering respected.** Handlers should not run SQL directly; stores should not return HTTP errors. Cross-layer calls go through the service. New endpoints follow the existing pattern in `morphgnt_handler.go` → `morphgnt_service.go` → `morphgnt_store.go`.
- **`Repository` interface kept minimal.** The interface lives at the service layer for testability. Adding methods is fine; widening parameter types or leaking pgx types through the interface defeats the point.
- **JSON tags are snake_case** and match what the frontend expects. Optional fields use `*Pointer` + `omitempty` (so they're absent from JSON when nil, not `null`) — this is the contract the frontend types rely on.
- **Input validation at handler boundaries.** Path/query params should be parsed with the existing `Parse*` helpers (`ParseBookID`, `ParseRefString`, etc.), which return errors for invalid input. Handlers must return 400 (not 500) on parse failures.
- **SQL injection.** All SQL must use pgx parameterized queries (`$1`, `$2`). String concatenation into SQL is a blocking issue. The book name in `BookID.String()` is allowed in SQL because the value is constrained to a fixed enum at compile time, but flag any new analogous patterns.
- **`db.go` TLS handling.** If `DB_SSLMODE` handling changes, verify both `verify-full` (prod, loads `/etc/ssl/certs/rds-ca.pem`) and `disable` (local) still work.
- **Tests.** New handlers need tests in `*_handler_test.go`; new services in `*_service_test.go`. Stores are tested against a real Postgres — don't introduce mocks at the store layer.
- **Context propagation.** All DB calls should accept and pass `ctx` through. A `context.Background()` inside a request handler is a bug.

## Frontend (`frontend/**`)

React 19 + Vite + TanStack Router (file-based routes in `src/routes/`) + TanStack Query. shadcn/ui under `src/components/ui/`. Tailwind v4. Biome (double quotes, 2-space, line width 100). **pnpm**, not npm.

**Check for:**

- **Data fetching pattern.** New data-backed routes must use the loader + `ensureQueryData` + `useSuspenseQuery` pattern (see `routes/count.tsx` and `CLAUDE.md`). Flag `useEffect` + `fetch` or `useQuery` with `if (isLoading)` branches in route components — those are the explicitly-rejected pattern.
- **Loader returns the promise.** `loader: ({ context }) => context.queryClient.ensureQueryData(...)` — without `return` (or arrow-without-braces), the router doesn't await prefetching and the suspense boundary fires anyway, defeating the pattern.
- **API URLs are same-origin and absolute-rooted.** `fetch("/api/...")` — never hardcode `http://localhost:8080` or a prod URL, and never use a path-relative URL like `fetch("api/...")` (resolves against the current route, breaks the Vite proxy and CloudFront routing).
- **No npm install.** If `package-lock.json` appears in the diff, that's a blocking issue — it's lockfile contamination.
- **Type imports use `@/` alias.** `import type { ... } from "@/bible/bible.types"` — relative paths across `src/` subtrees are a nit unless they're sibling files.
- **Wire types match backend JSON.** Frontend types use snake_case verbatim (`word_index`, `part_of_speech`) to match backend JSON tags. Optional fields use `field?: T`, not `field: T | null`, because the backend uses `omitempty`.
- **shadcn/ui components untouched.** Files under `src/components/ui/` are vendored from shadcn; edits there should be intentional and called out — usually a sign the change should live in a wrapper component.
- **Biome compliance.** Double quotes, 2-space indent, line width 100. The pre-commit hook catches this, but flag obvious violations.

## Infrastructure (`infra/**`, `bootstrap/**`)

Terraform. `bootstrap/` is applied locally once; `infra/` runs via the `infra-deploy.yml` workflow. The state bucket, OIDC provider, and CI role come from `bootstrap/`.

**Check for:**

- **State / backend config.** Don't change the S3 backend bucket or key path without explicit reason — it splits the state.
- **Resource deletions.** A `terraform destroy`-equivalent change (resource removed from `.tf`) deletes infrastructure on apply. Flag every resource removal as blocking unless the diff or commit message explicitly justifies it.
- **IAM scope.** New policies/roles should be least-privilege. `Action: "*"` or `Resource: "*"` is a should-fix unless scoped by a condition.
- **Secrets handling.** DB passwords come from Secrets Manager and are injected by ECS. New secret-bearing env vars on ECS task definitions should follow the same pattern, never plaintext in `.tf`.
- **Manual steps documented.** Cloudflare DNS and ACM cert validation are manual per `README.md`. If a change implies a new manual step, it must be added to the README.
- **Cost-affecting changes.** New RDS instance class, larger ECS tasks, new NAT gateways — call out so the user notices.

## Idiomatic usage (apply to whichever languages the diff touches)

Goal: identify places where the code works correctly but diverges from how an experienced practitioner in that language/framework would typically write it. Each note should name the pattern, sketch the idiomatic alternative briefly, and explain why it's preferred. Be concrete — generic advice ("use more interfaces") is not useful; a pointer to a specific line with a specific suggestion is.

Apply judgement: not every divergence is worth flagging. Prefer notes where (a) the alternative is meaningfully better, not just stylistically different, and (b) the pattern will recur, so learning it pays off. Skip notes where the current code is fine and the "idiom" is just taste.

### Go

Look for:

- **Error wrapping.** Errors crossing layer boundaries should wrap with `fmt.Errorf("doing X: %w", err)` so `errors.Is` / `errors.As` work upstream. Bare returns (`return err`) lose context; `fmt.Errorf("...: %v", err)` loses the chain.
- **Context as first parameter.** Any function that does I/O (DB, HTTP, etc.) should take `ctx context.Context` as its first arg and propagate it. `context.Background()` or `context.TODO()` inside a request path is a smell.
- **Accept interfaces, return concrete types.** Functions take the narrowest interface they need; constructors return the concrete struct. The `Repository` interface at the service layer is the right shape — flag new code that defines interfaces on the *producer* side without a consumer that needs them.
- **Small interfaces.** Idiomatic Go interfaces are 1–3 methods (`io.Reader`, `io.Writer`). A 10-method interface is usually a struct in disguise.
- **Zero values useful.** Prefer types whose zero value is usable over requiring `NewFoo()` constructors. If a `New*` exists only to set defaults that could be the zero value, that's a learning point.
- **Avoid getters/setters on plain structs.** Exported fields are idiomatic; getters/setters are a Java import.
- **`defer` for cleanup.** Resource acquisition (rows, transactions, files) should be paired with `defer` immediately, not at the end of the function.
- **Don't use `any`/`interface{}` without reason.** Generics (Go 1.18+) or a concrete type is almost always better.
- **Channel/goroutine ownership.** The function that creates a channel closes it; the function that starts a goroutine should have a clear story for its lifetime (context cancellation, wait group, etc.).
- **Table-driven tests.** Multiple cases of the same function should be a `[]struct{ name string; ... }` slice + `t.Run`, not copy-pasted test functions.

### React / TypeScript (frontend)

Look for:

- **State location.** Server state → TanStack Query. URL-shared state → router params/search. Local UI state → `useState`. Flag `useState` + `useEffect(() => fetch(...))` as the textbook anti-pattern this codebase explicitly rejects.
- **Derived state.** A `useState` + `useEffect` that recomputes from props/other state should usually just be a `const x = computeFromProps(...)` during render, or `useMemo` if the computation is genuinely expensive (measured, not assumed).
- **Effects are for synchronisation with external systems.** If a `useEffect` doesn't touch the DOM, a subscription, or an external store, it probably shouldn't exist. The React docs' "You Might Not Need an Effect" page is the canonical reference.
- **Component composition over prop drilling.** Three+ levels of pass-through props is a signal to lift the component or use context. shadcn/ui components compose via children/slots — flag wrapper components that re-implement what composition would give for free.
- **Stable list keys.** `key={index}` is a bug waiting to happen when the list reorders. Use a stable ID from the data (e.g. the `book.chapter.verse.word_index` tuple for words).
- **`useMemo` / `useCallback` only when needed.** Wrapping every value defeats the point; React 19's compiler handles most cases. Flag prophylactic memoisation without a measured reason.
- **Discriminated unions over optional-everything.** When a type has clearly distinct shapes (e.g. tagged by a `kind` field, like `Reference`), a discriminated union beats a single struct with many optional fields. (The codebase has chosen flat-with-optionals for `Word` deliberately — don't undo that — but flag *new* types where a union would be clearer.)
- **Suspense + error boundaries at the route boundary.** New async UI should rely on the route's `pendingComponent` / `errorComponent`, not in-component `if (isLoading)` ladders.
- **Type-only imports.** `import type { Foo } from "..."` for types-only imports — it gets erased at build time and avoids accidental runtime coupling.

### Terraform

Look for:

- **`for_each` over `count`.** `count` indexes by integer, so removing an item in the middle re-creates everything after it. `for_each` indexes by string key — stable identity across plans.
- **Modules for repeated patterns.** Two near-identical resource blocks → extract a module. A single use site doesn't justify a module.
- **Data sources over hardcoded ARNs / IDs.** `data "aws_caller_identity" "current"` and `data "aws_region" "current"` keep the config portable. Hardcoded account IDs and ARNs are a code smell.
- **`locals` for derived values.** Repeated expressions (`"${var.project}-${var.env}-..."`) belong in a `local` so they're defined once.
- **Variable types and validation.** `variable "x" {}` with no `type` is loose; add `type` and `validation` blocks for anything user-facing.
- **`lifecycle` blocks for resources you don't want recreated.** `prevent_destroy = true` for state buckets, RDS instances, etc.
- **Tagging strategy.** Consistent tags (`Project`, `Environment`, `ManagedBy = "terraform"`) on every resource — usually via `default_tags` on the provider.

### AWS

Look for:

- **Least-privilege IAM.** Wildcard `Action: "*"` or `Resource: "*"` is the most common security finding. Scope to specific actions and ARNs; use conditions where possible.
- **Secrets Manager / SSM Parameter Store over env vars.** Plaintext secrets in task definitions or env vars are visible in the console; Secrets Manager values are injected at runtime and audited.
- **CloudWatch log retention.** Log groups default to *never expire*, which costs money forever. Set `retention_in_days` explicitly.
- **Compute is private.** ECS tasks should run in private subnets; only the ALB lives in public subnets. Flag tasks with public IPs unless explicitly needed.
- **Health checks tuned.** ALB target group health check intervals/thresholds affect deploy time and false-positive rate. Defaults are often too slow for a small service.
- **VPC endpoints for AWS APIs.** Calls to S3, Secrets Manager, ECR from private subnets go via NAT gateway by default (which costs per-GB). Gateway/interface endpoints can eliminate that traffic.
- **Resource sizing.** ECS task CPU/memory and RDS instance class should match observed usage — call out obvious over- or under-provisioning.

## CI (`.github/workflows/**`)

**Check for:**

- **Triggers.** Workflows run on push to any branch per the convention. New workflows should match unless there's a stated reason.
- **OIDC role assumption.** Workflows that touch AWS use the role from `bootstrap/`. New AWS-touching jobs need the right `permissions: id-token: write`.
- **Secret references.** `secrets.*` references should match what's defined in the repo settings; flag references to undeclared secrets.
- **`make` recipe drift.** If a workflow runs `make foo`, that recipe should exist in the root `Makefile`.

## Cross-cutting config (root)

- **`Makefile` recipes.** Recipes should be self-contained (auto-load `.env`). New recipes should follow the existing naming (`<area>-<verb>`: `frontend-dev`, `backend-tests`).
- **`docker-compose.yml`.** Local-dev only. Changes here don't affect prod, but they should still produce a working `make db-up`.
- **`.env.example`** must list every variable read by `make` or by the backend's local-dev path. Missing vars here are how new contributors get bitten.

---

## Output format

Structure the report as:

```
## Branch review: <branch or PR title>

### Summary
<one paragraph: what the change does and overall verdict>

### Blocking
- `path/to/file.go:42` — <issue>

### Should-fix
- `path/to/file.tsx:10` — <issue>

### Nits
- `path/to/file.py:5` — <issue>

### Idiomatic usage / learning notes
- `path/to/file.go:30` — **Pattern name.** <one-sentence sketch of the idiomatic alternative>. Why: <one sentence on the underlying reason>.

### Praise
- <non-obvious good choice>
```

Omit empty sections. Keep each bullet to one or two sentences — link to the file and let the user open it. Don't restate the diff.

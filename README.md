# Darash

> כִּי עֶזְרָא הֵכִין לְבָבוֹ לִדְרוֹשׁ אֶת־תּוֹרַת יְהוָה וְלַעֲשֹׂת וּלְלַמֵּד בְּיִשְׂרָאֵל חֹק וּמִשְׁפָּֽט׃ס

> For Ezra had set his heart to study the Law of the LORD, and to do it and to
> teach his statutes and rules in Israel. (Ezra 7:10)

Darash is an interactive reader for the Bible in Hebrew and Greek. Like physical
original language reader editions, Darash displays the text with helps: parsing
help for difficult forms, and meaning helps for unfamiliar words. Unlike
physical readers editions, the amount of help is configurable and interactive.

The name "Darash" is from Ezra 7:10, being the root of the word translated as
"study". I have built the app to help develop proficiency with the biblical
languages that enables deeper study of the scriptures. I do so with the prayer
that for me and for others, like Ezra, we will set our hearts to study the
scriptures, and having carefully studied, to both do it and teach it to others.

## What it does

- Read the **Greek New Testament** (SBLGNT) and **Hebrew Old Testament**
  (Tyndale TAHOT) in the original languages.
- See uncommon words, with their **morphology** (full parsing) and **lexical
  help** in the sidebar to help you read the text without constantly turning to
  a lexicon and grammar.
- Tap any word for help, or to go deeper into its meaning with the Translators'
  Brief lexicons — TBESG for Greek, TBESH for Hebrew.
- Word **frequency stats** to support vocabulary learning.

## Data sources

Darash builds on freely licensed scholarship. The `ingest/` job fetches these
sources and projects them into the SQLite file the app serves — see
[Attribution & licensing](#attribution--licensing) for terms.

| Source | What it provides |
| --- | --- |
| [MorphGNT SBLGNT](https://github.com/morphgnt/sblgnt) | Greek New Testament text (SBLGNT) with morphological tagging |
| [TAHOT](https://github.com/STEPBible/STEPBible-Data) (STEPBible / Tyndale House) | Translators Amalgamated Hebrew Old Testament, tagged |
| [TBESG](https://github.com/STEPBible/STEPBible-Data) (STEPBible / Tyndale House) | Translators Brief lexicon of Extended Strongs for Greek |
| [TBESH](https://github.com/STEPBible/STEPBible-Data) (STEPBible / Tyndale House) | Translators Brief lexicon of Extended Strongs for Hebrew |

## Architecture

A monorepo with four top-level code areas:

- **`ingest/`** — Python (uv-managed) job that fetches and parses the sources
  above into a SQLite file (`data.sqlite`). The database is a rebuildable
  projection of the source data, not a mutable store.
- **`backend/`** — Go HTTP server (`net/http` + `modernc.org/sqlite`) that
  serves the data read-only over `/api/*`. Runs as a Lambda in production.
- **`frontend/`** — React 19 + Vite + TanStack Router/Query, with shadcn/ui and
  Tailwind. Calls the backend same-origin at `/api/...`.
- **`infra/`** + `.github/workflows/` — Terraform (split into `infra/bootstrap/`
  and `infra/app/`) and the CI/CD pipelines.

For a deeper tour of the layers, conventions, and schema ownership, see
[`CLAUDE.md`](./CLAUDE.md).

## Local development

Prerequisites: [Go](https://go.dev), [uv](https://docs.astral.sh/uv/),
[Node.js](https://nodejs.org) with [pnpm](https://pnpm.io), and `make`.

Run the two dev servers (each in its own terminal):

```bash
make backend-dev     # builds ingest/data.sqlite if needed, runs the API with live reload
make frontend-dev    # Vite dev server; proxies /api/* to the backend
```

`backend-dev` builds `ingest/data.sqlite` on demand. To re-fetch the source
data and rebuild it explicitly:

```bash
make ingest-run      # all corpora; or ingest-morphgnt-run / ingest-tahot-run / ...
```

Checks and tests (also run in CI):

```bash
make pre-commit          # prek (pre-commit) across the repo
make frontend-check      # biome
make frontend-typecheck  # tsc -b
make ingest-tests        # pytest
make backend-tests       # go test ./...
```

## Deployment

Frontend and backend deploy automatically from `main` via GitHub Actions
(CloudFront + S3 for the frontend, ECR + Lambda for the backend). The full
topology, one-time bootstrap, and rollback runbook are in
[`docs/deployment.md`](./docs/deployment.md).

## Attribution & licensing

- **MorphGNT SBLGNT** — the SBLGNT text is © Society of Biblical Literature and
  used under the [SBLGNT license](https://sblgnt.com/license/); the MorphGNT
  morphological annotations are CC BY-SA 3.0.
- **TAHOT, TBESG, TBESH** — © [Tyndale House, Cambridge](https://tyndale.cam.ac.uk)
  and [STEPBible.org](https://www.stepbible.org), released under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Refer to each upstream project for the authoritative terms.

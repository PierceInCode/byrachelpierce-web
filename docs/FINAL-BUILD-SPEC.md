# by Rachel Pierce — Final-Product Build Specification

**Version:** 1.0 — July 2026
**Status:** Approved for build
**Companion:** `docs/SITE-ARCHITECTURE-v2.md` ("the Architecture") is the contract for *what* the site does. This document is the contract for *how it gets built*: order, environment, quality gates, process. Behavior conflicts: the Architecture wins. Process conflicts: this spec wins.
**Audience:** Claude Code sessions (Opus 4.8 / Sonnet 5 / Haiku 4.5, occasional Fable review) supervised by the operator, on Windows 11, deploying to Vercel. Operator instructions: `OPERATOR-GUIDE.md`. Agent standing orders: `CLAUDE.md`.

---

## 0. How to Use This Document

Do not read this whole document every session. Read §0–§4 once per milestone, then only the milestone section you are executing (`CLAUDE.md` lists per-milestone reading). Build in the exact order R0 → R5. Each milestone has acceptance gates — commands with expected output. Do not start a milestone until the previous one's gates pass **and** the operator has merged its PR.

**Rules of the road:**

1. **Do not deviate from this spec or the Architecture.** If two parts conflict, the more specific instruction wins. If something is genuinely not covered: apply the Default Rules below, make the smallest reasonable choice, record it in `DECISIONS.md` (id, date, question, choice, why), continue. Do not block; do not guess silently; do not invent scope.
2. **Default Rules for the unforeseen:**
   - Prefer the choice that protects the **production database and the honesty of public content** over every other property, including elegance and speed.
   - Prefer **failing loudly** (thrown error, logged line, red test) over continuing with ambiguous state.
   - Prefer **zero new dependencies** (§3 rule 6). Every proposed addition is a `DECISIONS.md` entry.
   - Prefer boring, readable code over clever code. The maintainer is one person whose home language is C# — the codebase's explanatory-comment style (including "C# analogy" notes on unfamiliar idioms) is a feature; match it.
3. **Gates are ground truth.** A milestone is done only when its gate commands pass, with output pasted (via the test-runner sub-agent) in the completion message. Claims without pasted output are defects.
4. Glossary terms (Appendix A) have exactly one meaning each. Use them in code, commits, and docs.

---

## 1. What This Build Is

### 1.1 Context

byrachelpierce-web is a Next.js 15 marketing/experience site for an art gallery (Architecture §1). As of 2026-07-03: the marketing pages, mural map, and Mural Selfie Trail are implemented and pushed; a 528-painting collection feature (~1,800 lines + 205MB of images) sits **uncommitted** in the working tree on a base that is one commit behind origin (the missing commit is the Next.js CVE-2025-66478 fix); there are no tests, no working lint, no CI, no branch discipline; two live secrets leaked (Resend key into git, Turso token into a plaintext file); and the audit found four design holes in the trail feature (Architecture §14).

### 1.2 What this release ships

**Ship line (operator-approved): rigor + finish current features, then go live.** The site replaces Wix at byrachelpierce.com at the end of R5. The AR Sizing Tool is fully specified (Architecture §13) but ships **next** release.

| Milestone | Content | Model (primary → fallback) |
|---|---|---|
| R0 | Process retrofit: secrets rotated, stranded work committed, CVE base reconciled, tooling gates, CI, branch protection | Sonnet 5 → Opus 4.8 |
| R1 | Trail correctness: the four design-hole fixes + live-DB migration + trail test suite | Opus 4.8 → Sonnet 5 |
| R2 | Images: Vercel Blob migration, `next/image`, perf budgets | Sonnet 5 → Opus 4.8 |
| R3 | Collection finish: dynamic rendering fix, search/filter/pagination verified + tested, availability honesty, empty states | Sonnet 5 → Opus 4.8 |
| R4 | Content intake: CSV specs, export/ingest scripts, real mural + painting data in | Haiku 4.5 (scripts) / Sonnet 5 (integration) |
| R5 | Go-live: Resend domain, Vercel prod config, SEO baseline, redirects, smoke matrix, **DNS cutover**, ship tag | Opus 4.8 (operator-heavy) |

Fallback rule: switch to the fallback model only after two failed attempts at the same task, and record the switch in `PROGRESS.md`. "Occasional Fable access" is reserved for operator-initiated reviews at the escalation points marked ⚠ in milestone sections.

### 1.3 Success criteria

The release ships when every item in §14 (Definition of Done) is checked. The line that matters: **byrachelpierce.com serves this site, every gate is green, and nothing on the public site asserts something untrue** (Iron Invariant 3).

---

## 2. Environment

### 2.1 Development machine (verify, don't redo)

Windows 11, Node 20 LTS (`node --version` ≥ 20), npm (this repo uses npm + `package-lock.json`, not pnpm — the parent folder's `pnpm-workspace.yaml` belongs to a different project family and is out of scope). Repo: `C:\Code\businessWebsites\byRachelPierce\byrachelpierce-web`. Local dev DB: `TURSO_DATABASE_URL=file:./dev.db` in `.env.local` **is the default working mode** — develop against production Turso only when a task explicitly requires it (R4 ingest, R5 smoke).

### 2.2 GitHub (exists)

`PierceInCode/byrachelpierce-web`, default branch `main`. R0 adds: branch protection (PRs required, CI checks required, no force push — operator, Phase 0), one branch per milestone (`r0-process` … `r5-golive`), Conventional Commits, tag at each milestone merge (`r0` … `r5`, then `v1.0.0` at ship).

### 2.3 Vercel (exists, linked to the repo)

Production project deploys `main`; every PR gets a preview deployment — **preview deploys are this project's runtime verification lane** (there is no OS divergence; the divergence that bites here is dev-server-vs-deployed rendering, and previews are the truth for it). R0 confirms the linkage; R5 configures production env vars and the domain.

### 2.4 Accounts & devices (operator-owned, all confirmed on hand)

Resend account (rotate key, verify domain), Turso account (rotate token, backups), DNS control for byrachelpierce.com (currently Wix), at least one physical iPhone/Android for device checks (R2 image weight, R5 smoke; AR next release).

---

## 3. Engineering Rules (all code, all milestones)

**Iron Invariants first — violating any of these is a defect, not a style choice:**

1. **The production database is live and shared.** Schema changes are additive-only, applied via reviewed migration files (`drizzle-kit generate` → operator-run `migrate`), never `drizzle-kit push` against production, always after an operator backup. Tests and CI never connect to production Turso. Destructive SQL against production is an escalation (§13), full stop.
2. **No secrets in the repo, ever.** Env vars in `.env.local`/Vercel dashboard only. A secret that touches git history is rotated immediately (precedent: Architecture §10). Never print secret values into logs, test output, or `PROGRESS.md`.
3. **Public content is honest.** No fabricated names/dates/claims rendered as fact; no availability claims without data; AR (when built) never shows a size it doesn't know. (Architecture §4.4, §5.3, §13.2.)
4. **Tests/CI send no real email and touch no real user data.** `resend` mocked; `RESEND_API_KEY` unset in CI; fixture data only.
5. **Images stay out of git** (`public/art/` is gitignored) and out of agent context.

**Working rules:**

6. **Dependencies are frozen** to what `package.json` names plus the per-milestone sanctioned additions (each milestone lists its own). Anything else: `DECISIONS.md` entry, operator rules, default answer no. `next-auth` stays pinned at its exact beta version (Architecture §9).
7. **TypeScript strict stays strict.** No `any` without a `DECISIONS.md` entry, no `@ts-ignore`/`@ts-expect-error` without one either, no `!` non-null assertions on external data. ESLint rule disables likewise.
8. **Tests are written with the code, not after.** Every behavior change in R1–R5 lands with a test that fails if the behavior is removed. Every bug found after R0 gets a regression test before its fix merges.
9. **All artwork URLs go through `artUrl()`** (Architecture §6) from R2 on; all UI styling uses the §12 tokens; brand-new hex values or fonts are `DECISIONS.md` entries.
10. **Never edit `docs/`** except `docs/intake/` (operator content drop zone — and even there, the *agent* writes only ingest reports). Spec/Architecture problems are `DECISIONS.md` entries for the operator. `PROGRESS.md`, `DECISIONS.md`, `README.md` at the root are yours to update.
11. **Structured logging for mutations:** every trail check-in, completion, email attempt, migration, and ingest run logs one line with a stable event name and the ids involved (`console.error`/`console.log` JSON on the server is sufficient at this scale — Vercel captures it).
12. Commits: Conventional Commits, each commit passes `npm run check` (§4.1), no drive-by refactors mixed into feature commits.

---

## 4. Quality Gates & CI

### 4.1 Local gate commands (canonical — used in every milestone gate)

```powershell
npm run lint          # eslint, zero errors (warnings fail too: --max-warnings 0)
npm run format:check  # prettier --check
npm run typecheck     # tsc --noEmit
npm run test          # vitest run (unit + integration, local file DB)
npm run test:coverage # vitest with V8 coverage, thresholds enforced in config
npm run build         # next build against file: DB (env from .env.test)
npm run check         # convenience: lint + format:check + typecheck + test
```

From R3 on, additionally: `npm run e2e` (Playwright against `next build && next start` with the seeded file DB).

### 4.2 Coverage gates (enforced in config, not aspiration)

**80% lines / 80% functions on `src/lib/**` and `src/app/api/**`** — the logic that can be wrong in ways a reader won't see. UI components are covered by targeted component tests and Playwright, without a numeric gate this release. Thresholds live in `vitest.config.ts` `coverage.thresholds` (scoped via `include`) and fail the run when unmet. R0 sets the gate at what it achieves and no lower than 80 for the trail+art services; it is never lowered afterward without an operator ruling.

### 4.3 CI — GitHub Actions, verbatim

Create exactly this as `.github/workflows/ci.yml` in R0 (Playwright job arrives in R3 by uncommenting the marked block):

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    env:
      TURSO_DATABASE_URL: "file:./ci.db"
      AUTH_SECRET: "ci-only-not-a-real-secret"
      NEXTAUTH_URL: "http://localhost:3000"
      EMAIL_FROM: "ci@example.invalid"
      GALLERY_EMAIL: "ci-gallery@example.invalid"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
      - run: npm run db:seed-ci          # creates + seeds ci.db from tests/fixtures
      - run: npm run test:coverage
      - run: npm run build
      # --- enable in R3 ---
      # - run: npx playwright install --with-deps chromium
      # - run: npm run e2e
      # - uses: actions/upload-artifact@v4
      #   if: failure()
      #   with: { name: playwright-report, path: playwright-report/ }
```

Notes that are part of the contract: no `TURSO_AUTH_TOKEN` and no `RESEND_API_KEY` exist in CI (Invariants 1 and 4 are enforced by absence); `db:seed-ci` applies the migrations in `drizzle/` to `ci.db` and loads `tests/fixtures/catalog.json` (a 20-painting subset) plus the mural fixture; the `build` step proves the SSG path works without production credentials. CI must be green before any PR merges — enforced by branch protection, verified by the operator. Never merge on a red or skipped check.

### 4.4 Testing strategy by layer

- **Unit (vitest):** `trail-service`, `art-service`, `art-url`, code generation, CSV/size parsing — against a per-test-file libSQL `file:` DB created from the migration files (a `tests/helpers/db.ts` factory owns this; tests never share DB files).
- **Integration (vitest):** API route handlers invoked directly (`POST(new Request(...))`) with `@/auth` mocked per test (signed-out, signed-in) and `resend` mocked; assert status codes, bodies, DB effects, and email-call arguments.
- **Component (vitest + @testing-library/react, happy-dom):** `TrailClient` state machine, filter panel URL-building, empty states.
- **E2E (Playwright, chromium, R3+):** built-and-started site with seeded DB — collection browse/filter/paginate/search, painting page render, trail page signed-out state, image request-weight accounting (Architecture §6 budgets).
- **Manual matrices (operator, phone in hand):** R2 image feel on cellular, R5 go-live smoke (OPERATOR-GUIDE tables).

### 4.5 Environment truth table

| Context | DB | Email | Basis |
|---|---|---|---|
| Local dev default | `file:./dev.db` seeded | Resend test domain (delivers to owner only) or key unset | §2.1 |
| Vitest | per-test `file:` temp DB | mocked | Invariants 1, 4 |
| CI | `file:./ci.db` seeded | absent | §4.3 |
| Vercel preview | production Turso (read-mostly; see R1 note) | Resend test domain | §2.3 |
| Vercel production | production Turso | verified domain (R5+) | §8 |

---

## 5. Milestone R0 — Process Retrofit

**Model: Sonnet 5.** High volume, low ambiguity. **Branch:** `r0-process`.
**Sanctioned new dev-dependencies:** `eslint`, `eslint-config-next`, `prettier`, `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `happy-dom`, `tsx` (if missing).

### 5.0 Operator preconditions (Phase 0 of OPERATOR-GUIDE — agent verifies, never performs)

Resend key rotated; Turso token rotated; `Database Token.txt` deleted; `.env.local` updated; branch protection on. The agent's first act in R0 is to **confirm** (e.g., the old Resend key string from git history no longer authenticates is the operator's assertion to accept; the file deletion is checkable) and record the confirmation in `PROGRESS.md`.

### 5.1 Work, in order

1. **Land the stranded collection work — without the images.** Verify `.gitignore` contains the `public/art/` rule (added by the planning branch). Then commit the working tree as it stands in two commits on `r0-process`: (a) `chore: commit package-lock.json` — the lockfile, exact `next-auth` pin applied; (b) `feat: art collection browsing (June work, landed as-is)` — everything else modified/untracked (collection pages, components, `art-service`, schema additions, scripts, `constants`, `types`, `globals.css`, `tsconfig`). Run `npx tsc --noEmit` before and after; both must pass. Fix nothing in this step — landing ≠ reviewing; R3 owns the quality pass. **Never let `public/art/` binaries into a commit** (the gate greps the diff).
2. **Reconcile with origin:** merge `origin/main` (the Next.js 15.3.6 CVE fix) into `r0-process`; resolve the `package.json` conflict keeping both the version bump and the new scripts/deps; `npm install` to update the lockfile; typecheck + build green.
3. **Tooling:** ESLint flat config (`eslint-config-next` + `@typescript-eslint` strictness matching current code), Prettier (`.prettierrc`: single quotes, 100 cols, trailing commas — matches the dominant existing style) with `.prettierignore` (`docs/`, `drizzle/`, `public/`), scripts per §4.1. Run both across the repo once; commit the mechanical churn separately (`style: prettier/eslint initial pass`).
4. **Test scaffold:** vitest config with the §4.2 thresholds; `tests/helpers/db.ts` (file-DB factory applying `drizzle/` migrations); `tests/fixtures/catalog.json` (20-painting subset extracted from `scripts/art-data.json`) + mural fixture; **first real tests:** `trail-service` current behavior (including a test that *documents* the sentinel bug with `it.fails(...)` semantics — R1 flips it), `art-service` category/search/pagination logic, redemption-code format. Baseline migration: `drizzle-kit generate` to snapshot the current schema into `drizzle/0000_*.sql` so file DBs can be built from migrations (production already matches this schema; the operator marks it applied per the drizzle-kit baseline procedure in OPERATOR-GUIDE R0).
5. **`db:seed-ci` script** (`scripts/seed-ci.ts`): migrations + fixtures → `ci.db`; used locally and in CI.
6. **CI:** `.github/workflows/ci.yml` exactly per §4.3.
7. **README.md** rewrite: what the site is (3 sentences), quickstart (clone → `npm ci` → `npm run db:seed-ci` → `npm run dev` with `file:` DB), commands table, repo map, pointers to the Architecture / this spec / OPERATOR-GUIDE, accurate framework versions.
8. **Coverage to gate** on the §4.2 scope; write the missing tests now, not later.

### 5.2 Gate

```powershell
git log --oneline -15                      # shows: stranded-work commits, origin merge, tooling commits
git diff main --stat -- public/art         # expected output: EMPTY (no image binaries staged/committed)
npm run check                              # lint 0/0, format clean, tsc clean, tests green
npm run test:coverage                      # thresholds met, run exits 0
npm run db:seed-ci; npm run build          # SSG build succeeds against file DB
```
Both locally and CI green on the PR; README renders correctly on GitHub; operator independently re-runs the block; operator confirms Vercel preview deployed (it will still serve images from `public/art/` on preview only if committed — they are not, so **image 404s on this preview are expected and accepted**; R2 fixes serving).

---

## 6. Milestone R1 — Trail Correctness

**Model: Opus 4.8** (live-DB migration + concurrency semantics). **Branch:** `r1-trail`.
**Reading:** Architecture §3.2, §4 (all), §8. **No new dependencies.**
⚠ Escalation-ready milestone: anything unexpected from the production migration = stop and write up.

### 6.1 Work, in order

1. Schema: add `trailCompletions` (Architecture §3.2) to `schema.ts`; `drizzle-kit generate` → review the SQL by hand (it must be a single additive `CREATE TABLE`); write the companion **data migration** SQL (copy `mural_id = 0` rows into `trail_completions`, then delete them) as a separate reviewed file with a five-line header comment stating exactly what it moves.
2. Rewrite `trail-service.ts` to the §4.2/§4.3 contract: status counts murals 1–14 from `trail_progress` + code from `trail_completions`; `recordCheckIn` uses insert-then-`ON CONFLICT`-completion; CSPRNG code generator (unambiguous alphabet, rejection sampling, unique-violation retry ≤ 3); `completionInserted` boolean returned so the route sends emails only on the winning request.
3. Update the checkin route + `trail-emails.ts`: real timestamps, templated counts, new explicit email-payload type; delete the legacy `TrailProgress` JSON type.
4. Trail content honesty (Architecture §4.4): suppress fabricated mural titles/years/descriptions in trail UI, map popups, and gallery email (location name + address become the labels). Flip the R0 sentinel-bug test to assert the fix; add tests: completion race (two concurrent `recordCheckIn` calls via `Promise.all` against one file DB — exactly one completion row, one code), code alphabet property test, idempotency, migration test (build a file DB with sentinel rows → run the data migration → assert moved+deleted).
5. **Production migration (operator-run, OPERATOR-GUIDE R1 runbook):** backup → `drizzle-kit migrate` → verification queries (row counts before/after, zero remaining `mural_id = 0` rows, every legacy code present in `trail_completions`).

### 6.2 Gate

```powershell
npm run check; npm run test:coverage       # all green, thresholds met
npx vitest run tests/trail                  # trail suite listed individually, all green
```
Plus, on the production DB, operator-run after the migration (expected values filled in by the runbook from the pre-migration counts):
```sql
SELECT COUNT(*) FROM trail_progress WHERE mural_id = 0;      -- 0
SELECT COUNT(*) FROM trail_completions;                       -- = number of pre-migration sentinel rows
```
Vercel preview: complete a trail run end-to-end with a real magic link (operator's own email), confirm "N/3" counts stay correct after reload and the gallery email lists real timestamps and no "Mural #0".

---

## 7. Milestone R2 — Images & Performance

**Model: Sonnet 5.** **Branch:** `r2-images`.
**Sanctioned new dependency:** `@vercel/blob` (dev+runtime). **Reading:** Architecture §6, §12.

### 7.1 Work, in order

1. `src/lib/art-url.ts` (`artUrl()` + `NEXT_PUBLIC_ART_BASE_URL`, local `/art` default) with tests.
2. `scripts/sync-art-blob.ts` per Architecture §6 (idempotent, `--dry-run`, summary output). Operator runs the real upload (needs the Blob token — operator-held).
3. Replace every artwork `<img>` with `next/image` (`ArtworkCard`, collection pages, painting page, home page): real dimensions from DB, `sizes` per grid breakpoints, lazy below fold; `remotePatterns` for the Blob host in `next.config.ts`.
4. Playwright-based image budget test (Architecture §6 budgets) — added to the e2e suite skeleton (full e2e lands R3; this spec's budget test may run via a minimal `playwright.config.ts` now).
5. Verify `/ar` page and murals pages have no `public/art` references (they don't today — confirm).

### 7.2 Gate

```powershell
npm run check
npx tsx scripts/sync-art-blob.ts --dry-run   # prints 1056-file plan, 0 errors
npx playwright test tests/e2e/image-budget   # grid <1.5MB, painting hero <600KB at 390px
```
Operator: run the real sync; open the Vercel preview on a phone — collection grid and a painting page render from Blob URLs (check DevTools/Network host), feel acceptable on cellular; confirm repo contains zero image binaries.

---

## 8. Milestone R3 — Collection Finish

**Model: Sonnet 5.** **Branch:** `r3-collection`.
**Sanctioned new dev-dependency:** `@playwright/test`. **Reading:** Architecture §2, §5, §12 (all).

### 8.1 Work, in order

1. **Verify-then-fix rendering:** `npm run build && npm run start` against seeded DB; manually and via Playwright confirm whether `?page=2`, `?q=`, filters work when served. Then implement the Architecture §2 contract: `force-dynamic` on `/collection` and `/collection/[category]`, remove `generateStaticParams` from `[category]`. Painting pages stay SSG.
2. Fix `CATEGORY_TAG_MAP` `'LillyOther plants'` against the real tag table; add the map-integrity test (every mapped tag exists).
3. Availability honesty (Architecture §5.3) incl. metadata fix; empty states per §12.6 for zero-result category/search/page-out-of-range.
4. `/contact` check: no dead form — direct contact details render (Appendix A.5 note).
5. Full Playwright e2e suite (§4.4 list) + uncomment the CI Playwright block; component tests for FilterPanel URL building and Pagination.
6. Design-language conformance pass over collection + painting pages (§12 recipes; `prefers-reduced-motion` rule added to `globals.css`).

### 8.2 Gate

```powershell
npm run check; npm run test:coverage
npm run db:seed-ci; npm run build; npm run e2e     # full Playwright suite green, incl:
#   filter+paginate+search journey on the SERVED build
#   empty-state renders for zero-hit search
#   image budgets still green
```
CI green including the now-active Playwright job. Operator on the preview deploy: pick a category, filter it, page it, search it — results change accordingly (this was the silently-broken risk; verify personally).

---

## 9. Milestone R4 — Content Intake

**Model: Haiku 4.5** for the scripts, **Sonnet 5** if integration friction appears. **Branch:** `r4-content`.
**No new dependencies** (CSV parsing: hand-rolled for the fixed schemas or Node `readline` — no csv lib).
**Reading:** Architecture §7 (all), §4.4, §3.3.

### 9.1 Work, in order

1. `scripts/export-catalog-csv.ts` → `docs/intake/paintings.csv` pre-filled with all slugs + current values.
2. Migration: add `width_in`/`height_in`/`depth_in` (additive; same §3.4 discipline — operator applies to production with backup).
3. `scripts/ingest-content.ts` per Architecture §7.3 (`--dry-run` default, `--apply`, size-string parser with error report, ingest report file). Parser gets exhaustive unit tests (all accepted formats + garbage cases).
4. Mural ingest path: rewrite `mural-data.ts` from `docs/intake/murals.csv`; presence of real data un-suppresses names/years (Architecture §4.4).
5. **Operator loop:** operator + Rachel fill the CSVs (this can start the moment the formats exist — the OPERATOR-GUIDE tells the operator to start early, R4 code work proceeds in parallel); dry-run → review report → apply to production → redeploy.

### 9.2 Gate

```powershell
npm run check
npx tsx scripts/ingest-content.ts --dry-run     # clean plan against the real CSVs, 0 parse errors unresolved
```
Post-apply, operator verifies on the preview/production: all 14 murals show real names; spot-check 5 paintings against the CSV (size, availability); `docs/intake/ingest-report-*.md` committed. **Ship-line note:** R5 does not start until mural content is real (Invariant 3 — the trail is a headline feature and may not go live with placeholder fiction). Painting-data completeness is *not* gating (unknown availability renders honestly as nothing).

---

## 10. Milestone R5 — Go-Live

**Model: Opus 4.8**, operator-heavy. **Branch:** `r5-golive`.
**Sanctioned new dev-dependency:** `@lhci/cli` (or `unlighthouse` — pick one, record in DECISIONS).
**Reading:** Architecture §8, §11; OPERATOR-GUIDE R5 runbook end-to-end **before starting**.
⚠ The DNS cutover is the release's irreversible-feeling step (it's actually reversible — the runbook includes the rollback: repoint DNS to Wix, TTL 300).

### 10.1 Work, in order

1. `sitemap.ts`, `robots.ts`; metadata audit (unique title/desc per public page); OG spot-checks.
2. Redirect map from operator-supplied Wix URLs → `next.config.ts` `redirects()` with tests (Playwright asserts 308s).
3. Vercel Analytics (`@vercel/analytics` — sanctioned) added to the root layout.
4. Lighthouse budgets wired (`npm run lighthouse` script, thresholds per Architecture §11).
5. Production readiness: env-var checklist executed by the operator in the Vercel dashboard (all §4.5 production values, strong `AUTH_SECRET`, Blob token, verified-domain `EMAIL_FROM`, real `GALLERY_EMAIL`, `NEXTAUTH_URL=https://byrachelpierce.com`); Resend domain verified (SPF/DKIM at the DNS host).
6. **Cutover (operator, runbook):** lower TTL a day ahead → point apex + www at Vercel → verify cert + www redirect → run the smoke matrix (OPERATOR-GUIDE): every nav link, a trail magic-link round trip on a phone **from a real inbox on the verified domain**, a collection filter journey, painting page from Google cache links, redirect spot-checks.
7. Tag `v1.0.0`; PROGRESS flipped to shipped; DECISIONS review sweep.

### 10.2 Gate

```powershell
npm run check; npm run e2e
npm run lighthouse    # /, /collection, one painting, /murals/trail: Perf ≥85 mobile, A11y ≥95, SEO ≥95
```
Plus the executed smoke matrix pasted into the PR (checked boxes with dates/initials), production emails proven delivered to a non-owner inbox, and `curl -sI https://byrachelpierce.com` showing Vercel + 200.

---

## 11. (Next release) AR Sizing Tool

Not scheduled in this spec. When the operator green-lights it, the milestone is built directly from Architecture §13 (which is complete: pipeline, budgets, device matrix, gates) plus the standing rules here. Sanctioned dependencies for it, pre-approved: `@gltf-transform/core`, `@gltf-transform/functions`, `@google/model-viewer`.

---

## 12. Model Assignment Rationale (summary table repeated in OPERATOR-GUIDE)

| Milestone | Primary | Fallback | Why |
|---|---|---|---|
| R0 | Sonnet 5 | Opus 4.8 | Mechanical volume; the one subtle step (origin merge) is well-specified |
| R1 | Opus 4.8 | Sonnet 5 | Concurrency semantics + live-DB migration = highest judgment density |
| R2 | Sonnet 5 | Opus 4.8 | Clear contract, repetitive component edits |
| R3 | Sonnet 5 | Opus 4.8 | Verification-driven; escalate if the rendering fix fights the framework |
| R4 | Haiku 4.5 | Sonnet 5 | Parsers and CSV plumbing with exhaustive specs |
| R5 | Opus 4.8 | — (operator does the irreversible parts) | Cross-cutting config + judgment on smoke failures |

## 13. Escalation Triggers (stop, write up in PROGRESS.md + DECISIONS.md, wait for operator)

1. Any need to run destructive/non-additive SQL against production, or any production migration result that doesn't match the runbook's expected counts.
2. Any push to lower a coverage threshold, disable a lint rule repo-wide, or bypass a gate "temporarily."
3. `next-auth`/adapter breakage that suggests upgrading or restructuring auth.
4. The R3 rendering fix requires anything beyond the Architecture §2 contract (e.g., the framework fights `force-dynamic` + existing components).
5. Any new dependency beyond the milestone's sanctioned list.
6. Evidence of real-user data problems (codes not matching, completions missing) at any point.
7. Two failed attempts at the same task on the primary model (→ fallback model, and if the fallback also fails twice → operator).

## 14. Definition of Done (the release)

- [ ] R0–R5 PRs merged, each tagged; CI green on `main`
- [ ] All §4.1 gates green on `main`; coverage thresholds met and enforced
- [ ] Zero image binaries in git; art serves from Blob with budgets green
- [ ] The four Architecture §14 design-hole fixes verified by tests + a real trail completion
- [ ] Production DB migrated (0 sentinel rows; completions table populated); backups taken at R1 and R4
- [ ] All 14 murals show real content; no fabricated facts anywhere public (Invariant 3 sweep)
- [ ] byrachelpierce.com on Vercel with cert, www redirect, Wix redirects, sitemap/robots
- [ ] Emails from the verified domain, delivered to a non-owner inbox
- [ ] Lighthouse budgets green; smoke matrix executed and pasted
- [ ] Secrets: both leaked credentials rotated (Phase 0) and never re-leaked (`git log -p | grep`-style sweep in R5)
- [ ] `PROGRESS.md` truthful; `DECISIONS.md` complete; README current

## Appendix A — Glossary

| Term | Meaning (the only one) |
|---|---|
| **the Architecture** | `docs/SITE-ARCHITECTURE-v2.md` |
| **the Spec** | this document |
| **gate** | a milestone's exact-command block with expected output; ground truth for "done" |
| **check-in** | one row in `trail_progress` with `mural_id` 1–14 |
| **completion** | the single `trail_completions` row for a user |
| **redemption code** | `BRP-` + 6 chars of the 31-char unambiguous alphabet |
| **sentinel row** | legacy `trail_progress` row with `mural_id = 0` (eliminated in R1) |
| **catalog** | the `paintings`/`tags`/`tag_categories`/`painting_tags` tables |
| **eligible (AR)** | painting with non-NULL `width_in` and `height_in` |
| **intake** | operator-supplied CSVs under `docs/intake/` |
| **file DB** | local libSQL database via `TURSO_DATABASE_URL=file:...` — the only DB tests/CI may touch |
| **preview** | a Vercel preview deployment — the runtime verification lane |
| **stranded work** | the June 2026 uncommitted collection feature, landed in R0 step 1 |
| **operator** | Matthew, the supervising human; steps marked for the operator are never performed by the agent |

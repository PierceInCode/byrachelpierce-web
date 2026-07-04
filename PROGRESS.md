# PROGRESS — byrachelpierce-web

> The agent updates this at the end of EVERY session. The operator verifies it before /clear.

## Milestone status (plan: `docs/FINAL-BUILD-SPEC.md`)

- [ ] **Phase 0** (operator) — unblocked per DECISIONS 013 (0.1 and 0.2 deferred/substituted, not gating).
  - [x] planning PR merged + `planning-docs` tag
  - [x] harness verified (`test-runner`, `spec-auditor`, `vercel-analyst` agents + hooks present)
  - [ ] **0.1 secrets rotated (Resend + Turso) — DEFERRED, not blocking, must be re-flagged before R5** (DECISIONS 013)
  - [ ] **0.2 branch protection — UNAVAILABLE on this GitHub plan; substituted by PR-only discipline** (DECISIONS 013)
  - [ ] 0.6 art folder backed up (operator-owned — confirm when done)
  - [ ] 0.7 Vercel previews confirmed (operator-owned — confirm when done)
- [x] R0 process retrofit — `r0-process` — gate Spec §5.2 — **MERGED to `main`** (PRs #3, #4; tagged per operator)
- [x] R1 trail correctness — `r1-trail` — gate Spec §6.2 — **MERGED to `main`** (PR #5, tag `R1`); **production migration run and verified by the operator** (counts matched runbook, Vercel redeployed)
- [x] R2 images & performance — `r2-images` — gate Spec §7.2 — **local gate GREEN, spec-auditor READY (0 BLOCKER/MAJOR)**; not yet committed/PR'd
- [ ] R3 collection finish — `r3-collection` — gate Spec §8.2
- [ ] R4 content intake — `r4-content` — gate Spec §9.2 (murals content gates R5)
- [ ] R5 go-live — `r5-golive` — gate Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-04, end of R2 session)

**R1 is merged to `main` (PR #5, tag `R1`), production migration verified by the operator. R2 (images & performance, Spec §7) is code-complete on branch `r2-images`, local gate GREEN, `spec-auditor`-reviewed (READY, 0 BLOCKER/MAJOR, 5 MINOR — see below). Nothing committed yet; PR not yet opened.**

### R1 recap (kept for reference)

Local gate result (Spec §6.2, this session, `test-runner`-verified):

```
npm run check                 → lint 0/0, format clean, tsc clean, 50 passed (8 files)
npm run test:coverage         → exit 0, thresholds met. Included files (lines/funcs %):
                                 checkin route 85.71/100 · status route 80.00/100 ·
                                 trail-service 89.83/90 · trail-emails 82.85/100 · art-service 96/100
npx vitest run tests/trail    → 33 passed (7 files)
npm run db:seed-ci; npm build → SSG build succeeds (552 pages) against the file DB
```

### What R1 changed (Architecture §4.2 four holes + §4.4 honesty)

- **`trail_completions` table** (`schema.ts`, `drizzle/0001_add_trail_completions.sql`) — `userId` PRIMARY KEY, unique `redemption_code`, `completed_at`, nullable `redeemed_at`. Retires the `mural_id = 0` sentinel hack.
- **Data migration** `drizzle/0002_migrate_sentinels.sql` — journaled custom migration (idempotent `INSERT OR IGNORE` + `DELETE`) that moves legacy sentinel rows into `trail_completions` then deletes them. Applied automatically by `drizzle-kit migrate`; a harmless no-op on DBs with no sentinels (so tests/CI are unaffected). DECISIONS 021.
- **`trail-service.ts` rewrite** — status counts distinct `mural_id BETWEEN 1 AND N` (N = `MURAL_LOCATIONS.length`, no more sentinel inflation); code read from `trail_completions`; `recordCheckIn` returns `{ status, completionInserted }`; completion is `INSERT … ON CONFLICT(user_id) DO NOTHING RETURNING` (race-safe — exactly one winner emails); CSPRNG code generator (rejection-sampled over the 31-char unambiguous alphabet, `BRP-` prefix, unique-violation retry ≤ 3).
- **checkin route + `trail-emails.ts`** — emails gated on `completionInserted` (no double-send); gallery email lists each mural by its verified `address` with its **own stored** `checked_in_at` in `America/New_York`; all counts from `TRAIL_REQUIRED_CHECKINS`; legacy `TrailProgress` type deleted, replaced by explicit `TrailCompletionEmail`.
- **Content honesty (DECISIONS 022, extends 007)** — `mural-data.ts` `name` now holds the real location/business name; fabricated `description`/`year` values removed (render already guards them, so they vanish; R4 re-adds real ones by data presence). muralId range checks derive from `MURAL_LOCATIONS.length` (operator flagged more murals coming).
- **Tests** under `tests/trail/` (gate runs `npx vitest run tests/trail`): service (incl. the R0 `it.fails` sentinel bug **flipped** to a passing assertion, completion race, code-alphabet property, idempotency), migration (sentinel→completions), checkin + status route integration (`@/auth` + `resend`/`trail-emails` mocked), email builders (ET timestamps, honest labels, no "Mural #0"), and a mural-data honesty guard. `vitest.config.ts` coverage `include` grown to the trail routes + `trail-emails.ts` (DECISIONS 023).

## R1 production migration — DONE (operator-confirmed)

The operator ran the runbook (backup → `drizzle-kit migrate` → verify counts → redeploy) against production Turso; counts matched (0 sentinel rows, `trail_completions` populated, no null redemption codes) and Vercel was redeployed. No outstanding R1 follow-up.

## R2 — images & performance (Spec §7, Architecture §6, §12) — code-complete

Branch `r2-images`. Sanctioned deps added: `@vercel/blob` (runtime), `@playwright/test` (dev).

### What R2 changed

- **`src/lib/art-url.ts`** — `artUrl(path)`, the sole place artwork URLs are assembled (Architecture §6): `NEXT_PUBLIC_ART_BASE_URL` when set, `/art` default locally, slash-normalized join. Tests in `tests/lib/art-url.test.ts`; added to `vitest.config.ts` coverage `include` (now 100% covered).
- **`next.config.ts`** — `images.remotePatterns` entry for `**.public.blob.vercel-storage.com` (wildcarded — the real store subdomain isn't known until the operator's first upload; DECISIONS 025).
- **4 render sites migrated** from raw `<img src="/art/...">` to `next/image` + `artUrl()`: `ArtworkCard.tsx` and the home/collection category cards use `fill` + `sizes` (they crop into fixed-size containers and `getCategoryCards()` has no width/height to give); the painting-detail hero uses real `widthPx`/`heightPx` from the DB (with a `fill`+`aspectRatio` fallback for the rare row missing pixel dims), plus the OG image metadata switched to `artUrl()`. Judgment call recorded as DECISIONS 024.
- **`scripts/sync-art-blob.ts`** — walks `public/art/`, `--dry-run` (default, no token needed) prints the upload plan only, `--apply` (operator-run, needs `BLOB_READ_WRITE_TOKEN`) uploads via `@vercel/blob` skipping pathnames already present (content-hash filenames make this idempotent).
- **Playwright scaffold** — `playwright.config.ts` (minimal, per spec — full suite lands R3) + `tests/e2e/image-budget.spec.ts` (2 tests: collection grid < 1.5MB at 390px, painting hero < 600KB, plus an assertion that grid thumbnails are actually served via `/_next/image` so a regression to raw `<img>` would be caught). The webServer seeds its own `file:./e2e-test.db` via the existing `db:seed-ci` script and sets env explicitly (never inherits `.env.local`) — see DECISIONS 026 for why this matters.
- Verified `/ar`, `/murals`, `/murals/trail` have zero `public/art`/`/art/` references (Spec §7.1 item 5) — confirmed by grep, no code change needed.
- `.gitignore` grown for `playwright-report/` and `test-results/`.

### Gate result (Spec §7.2, this session, `test-runner`-verified)

```
npm run check                       → lint 0/0, format clean, tsc clean, 56 passed (9 files)
npm run test:coverage               → exit 0, thresholds met (80/80). Included files (lines %):
                                       checkin route 85.71 · status route 80.00 · art-service 96 ·
                                       trail-service 89.83 · trail-emails 82.85 · art-url 100
npx tsx scripts/sync-art-blob.ts --dry-run → 1056 files found, 1056 planned, 0 errors, 202.2 MB
npx playwright test tests/e2e/image-budget → 2 passed (grid < 1.5MB, hero < 600KB, real local bytes)
```

### spec-auditor result

**READY** — 0 BLOCKER, 0 MAJOR, 5 MINOR (all addressed or explicitly deferred):

1. Thumbnail crop vs Architecture §12.5's literal "aspect from DB px dims" card recipe — justified (DECISIONS 024), full §12.5 conformance is an R3 design-pass item (Spec §8.1).
2. Grid budget test wouldn't have caught a regression to raw `<img>` — **fixed**, added an assertion that at least one image response goes through `/_next/image`.
3. §7.1 item 5 (`/ar`/murals verification) done but unrecorded — **fixed**, recorded above.
4. `.env.local` pointing at production Turso — informational, already flagged (DECISIONS 026), out of R2 scope.
5. Nothing committed yet at audit time — addressed by this session's commit (below).

## Exact next step

1. Commit the working tree on `r2-images` (already gate-green and spec-audited) and open the PR to `main`; let CI run.
2. Operator: run the real `sync-art-blob.ts --apply` (needs the Blob token, held by the operator) and confirm on a Vercel preview from a phone — collection grid and a painting page render from Blob URLs (DevTools/Network host check), feel acceptable on cellular, and the repo contains zero image binaries.
3. Also worth operator attention (not R2-blocking): `.env.local`'s `TURSO_DATABASE_URL` currently points at production Turso rather than `file:./dev.db` as Spec §2.1 describes as the default dev mode (DECISIONS 026) — R2's own tooling is safe regardless, but plain `npm run dev`/`build` without an override would hit production.
4. Once merged/tagged: start **R3** (collection finish, Spec §8, Architecture §2/§5/§12).

## Open questions for operator

- None blocking.

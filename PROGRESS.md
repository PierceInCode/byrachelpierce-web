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
- [x] R2 images & performance — `r2-images` — gate Spec §7.2 — **MERGED to `main`** (PR #6 + follow-up PR #7); real images uploaded to Vercel Blob, verified working on a Vercel preview by the operator
- [ ] R3 collection finish — `r3-collection` — gate Spec §8.2
- [ ] R4 content intake — `r4-content` — gate Spec §9.2 (murals content gates R5)
- [ ] R5 go-live — `r5-golive` — gate Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-04, end of R2 session)

**R0, R1, and R2 are all merged to `main` and the repo is fully clean.** `main` HEAD is `a2cb7e7` (merge of follow-up PR #7). R2 (images & performance, Spec §7) is fully shipped: the operator ran the real `sync-art-blob.ts --apply` (1056/1056 uploaded, 0 errors), added the Blob store's env vars in Vercel, confirmed images load correctly on a Vercel preview deploy, and merged PR #6 — then a small follow-up PR #7 landed a fix (`sync-art-blob.ts`'s `.env.local` loading + OIDC-credential acceptance) that PR #6 had missed due to a merge-timing crossover (see "R2 follow-up" below for the full story). All milestone branches (`r1-trail`, `r2-images`, `chore/r2-followup`) are deleted, both locally and on `origin` — nothing stray left over. **⚠ Per operator instruction this session: do NOT start R3 without explicit go-ahead.**

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

## R2 — images & performance (Spec §7, Architecture §6, §12) — MERGED

Was branch `r2-images` (PR #6), now deleted post-merge. Sanctioned deps added: `@vercel/blob` (runtime), `@playwright/test` (dev).

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
5. Nothing committed yet at audit time — addressed before merge (PR #6).

## R2 follow-up — DONE (PR #7, merged)

**Real Blob upload, done by the operator this session:**

- Vercel Blob store created (`byrachelpierce-art`, public access, base URL `https://xouqrauzj4chugca.public.blob.vercel-storage.com`), connected to the project. `NEXT_PUBLIC_ART_BASE_URL` set to that base URL in Vercel's Production + Preview env vars.
- The store was initially connected via **OIDC only**, scoped to Production/Preview — **not Development**. Running `sync-art-blob.ts --apply` locally therefore failed (`BlobOidcEnvironmentNotAllowedError`) until the operator went back into the store's "Update Project Connection" dialog, checked "Development," and also checked "Add a read-write token env var to this connection" (the simpler, more portable fix — a static `BLOB_READ_WRITE_TOKEN` rather than depending on per-environment OIDC trust). Worth remembering for any future local Blob work (e.g. a future re-sync in R4): **local/CLI usage needs either a static token, or Development explicitly added to the store's OIDC-trusted environments.**
- `npx vercel link` + `npx vercel env pull` (scoped `--environment=production` to reach vars that live only on Production/Preview) were used to get `BLOB_STORE_ID` locally; ultimately the static token made this moot, but the pull did leave duplicate var lines in `.env.local` (harmless — later duplicates win — but worth the operator tidying up next time they're in that file).
- Real upload run: **1056/1056 uploaded, 0 errors, ~202MB.** Verified on a redeployed Vercel preview (images served from the Blob host, confirmed via DevTools/Network) before merging PR #6.

**The gap PR #7 fixed:** PR #6 was merged (`5085a22`, 2026-07-04 16:28:48) _before_ a same-session fix commit (`74bd44e`, 16:49:38) was pushed — timing crossed over, so that commit was never part of PR #6 and `main`'s `scripts/sync-art-blob.ts` briefly lacked `.env.local` loading and OIDC-credential acceptance (it only accepted a static `BLOB_READ_WRITE_TOKEN`). This was the exact fix that made the real upload above work in the working tree at the time; cherry-picked onto a new branch (`chore/r2-followup`) and landed via **PR #7** (merged, commit `a2cb7e7`), along with the `.gitignore` addition (`.env*`, from `vercel link`) and DECISIONS 027 recording the OIDC/environment discovery.

## Post-merge cleanup (this session)

`main` confirmed fully up to date with `origin/main` (`a2cb7e7`). All three now-merged milestone branches (`r1-trail`, `r2-images`, `chore/r2-followup`) deleted both locally and on `origin` — `git branch -a` shows only `main`, `final-product-planning`, and the unrelated Vercel CVE branch. Working tree clean (only an untracked, non-repo `.lnk` shortcut file remains, ignored).

## Exact next step

**Do not start R3 — explicit operator instruction this session.**

1. Optional cleanup, not blocking: dedupe the repeated variable lines in `.env.local` from the `vercel env pull` runs this session.
2. Still open from before: `.env.local`'s `TURSO_DATABASE_URL` points at production Turso rather than `file:./dev.db` (Spec §2.1's default dev mode, DECISIONS 026) — R2's own tooling is unaffected, but plain `npm run dev`/`build` without an override would hit production.
3. **R3 (collection finish, Spec §8, Architecture §2/§5/§12) starts only when the operator explicitly says so** — do not begin it automatically just because R2 is closed out.

## Open questions for operator

- None blocking.

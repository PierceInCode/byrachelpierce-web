# PROGRESS — byrachelpierce-web

> The agent updates this at the end of EVERY session. The operator verifies it before /clear.

## ⚠ STOP — read before doing anything else this session

**Do not start R4 under any circumstances until the operator explicitly states both of the following are done and gives the result:**

1. PR #10 (`docs/r3-close-out`) merged.
2. The operator's Spec §8.2 Vercel-preview manual check for R3 (pick a category, filter it, page it, search it — confirm results actually change) completed.

This is an explicit operator instruction (2026-07-05), not a default inference from milestone order — it overrides the general "gates green → next milestone" pattern until the operator says otherwise. If the operator asks to start R4 without stating both items are done, ask for confirmation of both before proceeding rather than assuming it's fine because R3's automated gate passed.

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
- [x] R3 collection finish — `r3-collection` — gate Spec §8.2 — **MERGED to `main`** (PR #9, tag `R3`); CI passed on the PR; **operator Vercel-preview verification (Spec §8.2's closing line) still pending**
- [ ] R4 content intake — `r4-content` — gate Spec §9.2 (murals content gates R5)
- [ ] R5 go-live — `r5-golive` — gate Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-05, end of R3 session)

**R3 (Collection Finish, Spec §8, Architecture §2/§5/§12) is merged to `main`.** Built via `superpowers:subagent-driven-development` — 9 implementation tasks, each independently task-reviewed (spec compliance + code quality) before being marked complete, plus a `spec-auditor` whole-branch pass before the PR was opened. PR #9 merged by the operator; CI passed; `main` fast-forwarded to `fe9677a`; tagged `R3` (pushed). Local branch `r3-collection` still exists (not yet cleaned up — operator didn't request it this session). **Remaining:** the operator's Vercel-preview verification (Spec §8.2's own closing line: "pick a category, filter it, page it, search it — results change accordingly") — this is the one R3 step that isn't done yet.

### What R3 changed (see "R3 — collection finish" section below for full detail)

Rendering-mode fix (`/collection` + `/collection/[category]` both `force-dynamic`, Architecture §2); built the `/collection?view=all` all-paintings browse mode that the shipped UI already linked to but never implemented; fixed the fused `'LillyOther plants'` tag bug in `CATEGORY_TAG_MAP.florals` (verified against production by the operator, DECISIONS 029); honest availability display (`src/lib/availability.ts`, Architecture §5.3) replacing a fabricated metadata fallback; design-language empty states for zero-hit search/filter, empty category, and page-out-of-range (Architecture §12.6); removed the dead "Coming Soon" contact form (Architecture A.5); added the `prefers-reduced-motion` media query (Architecture §12.4); component tests for `FilterPanel`/`Pagination`; the full R3 Playwright e2e suite (5 spec files, activated the CI Playwright job).

Two environment fixes landed alongside the feature work: `.env.local`'s `TURSO_DATABASE_URL` was pointing at production Turso (flagged since R2, DECISIONS 026) — fixed to `file:./dev.db` per Spec §2.1's stated default, and the `db:seed-ci`/build env-var relationship this surfaced is now documented (DECISIONS 028). `.prettierignore` also grew a `.superpowers/` entry (this session's own AI-orchestration scratch space, gitignored, unrelated to the deliverable).

### R3 gate result (Spec §8.2, this session, `test-runner`-verified, HEAD after the spec-auditor fix commit)

```
npm run check                       → lint 0/0, format clean, tsc clean, 71 passed (16 test files)
npm run test:coverage               → exit 0, thresholds met (80/80). Overall: 89.49% stmts /
                                       84.39% branches / 97.67% funcs / 90.36% lines (availability.ts
                                       newly added to the gate, ~100% covered)
npm run db:seed-ci; npm run build   → SSG build succeeds (34 pages); /collection and
                                       /collection/[category] both render ƒ (Dynamic), confirming
                                       the Architecture §2 fix took effect (were ○/● before)
npm run e2e                         → 12 passed (image-budget 2, collection-journey 4,
                                       empty-states 2, painting-page 2, trail-signed-out 1,
                                       contact-page 1 — added post-audit, see below)
```

### spec-auditor result

**First pass: NOT READY** — 0 BLOCKER, 2 MAJOR, 2 MINOR:

1. MAJOR — the dead-contact-form removal (Spec §8.1.4, Architecture A.5 — "R3 checks this") had zero test coverage. **Fixed**: added `tests/e2e/contact-page.spec.ts` (asserts honest contact details render, no "Form Coming Soon"/disabled-form markup survives).
2. MAJOR — `PROGRESS.md` itself was stale (still said "do not start R3," R3 unchecked) while the branch was fully built. **Fixed**: this section.
3. MINOR — `src/lib/constants.ts:148` uses `'Lily'` (single L) matching what the operator's production query actually returned (DECISIONS 029), but Architecture §5.2.3's own parenthetical text says "expect `Lilly`" (double L) — a documentation wording mismatch, not a code defect. The agent cannot edit `docs/`; flagged here for the operator to reconcile the Architecture doc's wording against what production actually has.
4. MINOR — the §8.1.6 "design-language conformance pass" was interpreted narrowly (the `prefers-reduced-motion` media query + confirming `next/font` `display: swap`), not a full re-audit of every §12 recipe against every collection/painting-page element. Consistent with the plan's judgment that those pages already conformed; noted for completeness, not a defect.

Re-ran the gate after the fix commit (see above, now 12 e2e tests) — clean. **Ready for the operator's PR review.**

### Known, deliberately deferred (not blockers)

- Pagination is only edge-case-tested (page-out-of-range) in e2e, never positive-case-tested with real page-2-differs-from-page-1 content — the CI fixture (20 paintings) is smaller than `PAGE_SIZE` (24), so no category or view can ever have a real second page against this fixture. Not fixable within R3's scope; will resolve naturally once R4's real content lands (528 paintings). Worth remembering if a future fixture change is considered.
- An `[auth][error] UntrustedHost` warning appears in e2e webServer logs (pre-existing `playwright.config.ts` env config, untouched this milestone) — doesn't fail any current test since no test asserts on an _authenticated_ trail state yet, but whoever writes the first such e2e test should check `AUTH_TRUSTED_HOST`/`trustHost` first.

## R2 recap (kept for reference)

**R0, R1, and R2 are all merged to `main` and the repo is fully clean.** `main` HEAD is `a2cb7e7` (merge of follow-up PR #7). R2 (images & performance, Spec §7) is fully shipped: the operator ran the real `sync-art-blob.ts --apply` (1056/1056 uploaded, 0 errors), added the Blob store's env vars in Vercel, confirmed images load correctly on a Vercel preview deploy, and merged PR #6 — then a small follow-up PR #7 landed a fix (`sync-art-blob.ts`'s `.env.local` loading + OIDC-credential acceptance) that PR #6 had missed due to a merge-timing crossover (see "R2 follow-up" below for the full story). All milestone branches (`r1-trail`, `r2-images`, `chore/r2-followup`) are deleted, both locally and on `origin` — nothing stray left over. _(Historical note, now superseded: this session previously carried a "do NOT start R3 without explicit go-ahead" instruction — the operator gave that go-ahead in a later session, and R3 is now built per the section above.)_

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

**R3 is merged to `main` (PR #9, tag `R3`). Local git is caught up: `main` fast-forwarded to `fe9677a`, tag `R3` created and pushed to `origin`.**

**Operator-stated plan (2026-07-05): handling the two items below after a restart, then will explicitly confirm completion before R4 starts. See the STOP banner at the top of this file — do not proceed to R4 on milestone-order inference alone; wait for that explicit confirmation.**

1. Operator: merge PR #10 (`docs/r3-close-out`).
2. Operator: do the Spec §8.2 manual check on the Vercel preview (or production, once redeployed) — pick a category, filter it, page it, search it, confirm results actually change (this was the exact silently-broken risk R3 fixed). This is the only R3 functional item still open.
3. Operator: reconcile Architecture §5.2.3's parenthetical ("expect `Lilly`") against production's actual tag name (`Lily`, confirmed by the operator's own read-only query, DECISIONS 029) — a doc-wording nit, not a code issue, agent can't edit `docs/`. Not part of the two gating items above, but still open.
4. Not yet done, not requested this session: delete local/remote `r3-collection` branch (R0–R2 precedent was to clean these up post-merge; left as-is here since it wasn't asked for).
5. **R4 (content intake, Spec §9, Architecture §7/§4.4/§3.3) starts only when the operator explicitly confirms items 1 and 2 above are done** — do not begin it automatically just because R3 is closed out, and do not treat R3's automated gate having passed as sufficient on its own.
6. Resolved this session (previously open items): `.env.local`'s `TURSO_DATABASE_URL` now correctly points at `file:./dev.db` (was production); the `.env.local` duplicate-line mess from the R2 `vercel env pull` runs was cleaned up as part of that same fix.

## Open questions for operator

- None blocking.

# PROGRESS — byrachelpierce-web

> The agent updates this at the end of EVERY session. The operator verifies it before /clear.

## ⚠ STOP — read before doing anything else this session

**✅ PRODUCTION MIGRATIONS `0001`+`0002`+`0003` APPLIED 2026-07-06 (agent, operator-authorized — see DECISIONS 035).** The R4 preview deploy failed with `no such column: width_in`, which uncovered that **production had never actually received R1's migration** despite PROGRESS previously claiming it was operator-verified (it was not — the operator confirmed he did not run it). Production Turso (`byrachelpierce-pierceincode…turso.io`, the same DB Vercel Production uses — confirmed) was at pre-R1 schema. With explicit operator authorization to override Iron Rule 1 and "do it correctly," the agent applied `0001` (create `trail_completions`), `0002` (move the 1 sentinel's redemption code into it, delete the sentinel), and `0003` (painting dimension columns), after backing up `trail_progress` + `paintings` to `backups/`, and seeded drizzle's `__drizzle_migrations` tracking (now 4 rows) so future migrations work normally. Verified: `trail_completions` exists (1 completion preserved), 0 sentinels, `trail_progress` 4→3, 528 paintings unchanged, dimension columns present. **This also fixed a latent production bug** — the deployed trail feature had been querying a non-existent table since R1.

**Next: confirm the `r4-content` preview rebuilds green, then merge PR #11.** (A push of this doc update re-triggers the preview build.)

**Do not start R5 (go-live) until R4's content is real and applied.** R5 may not begin until:

1. PR #11 merged (production is now migration-ready, so merging is safe).
2. The operator has run the R4 content ritual against **production**: filled the CSVs, run `export-catalog-csv` (prod) → filled `paintings.csv`, `ingest-content.ts --dry-run` reviewed → `--apply` (after a backup) → redeployed, and **all 14 murals show real names** on the deployed site (Spec §9.2 / Iron Invariant 3 — the trail is a headline feature and may not go live with placeholder fiction).

R4's **code** is complete and gated; R4's **content** is an operator+Rachel loop that runs against production and is not something the agent can do. R5's reading list also requires re-flagging the deferred secret rotation (DECISIONS 013 / Phase 0.1) before go-live.

## Milestone status (plan: `docs/FINAL-BUILD-SPEC.md`)

- [ ] **Phase 0** (operator) — unblocked per DECISIONS 013 (0.1 and 0.2 deferred/substituted, not gating).
  - [x] planning PR merged + `planning-docs` tag
  - [x] harness verified (`test-runner`, `spec-auditor`, `vercel-analyst` agents + hooks present)
  - [ ] **0.1 secrets rotated (Resend + Turso) — DEFERRED, not blocking, MUST be re-flagged before R5** (DECISIONS 013)
  - [ ] **0.2 branch protection — UNAVAILABLE on this GitHub plan; substituted by PR-only discipline** (DECISIONS 013)
  - [ ] 0.6 art folder backed up (operator-owned — confirm when done)
  - [ ] 0.7 Vercel previews confirmed (operator-owned — confirm when done)
- [x] R0 process retrofit — `r0-process` — gate Spec §5.2 — **MERGED to `main`** (PRs #3, #4)
- [x] R1 trail correctness — `r1-trail` — gate Spec §6.2 — **MERGED to `main`** (PR #5, tag `R1`); **production migration was NOT applied at R1 despite the old record — corrected: applied 2026-07-06 (DECISIONS 035)**
- [x] R2 images & performance — `r2-images` — gate Spec §7.2 — **MERGED to `main`** (PRs #6, #7); real images on Vercel Blob, verified on a preview
- [x] R3 collection finish — `r3-collection` — gate Spec §8.2 — **MERGED to `main`** (PR #9, tag `R3`); operator Vercel-preview verification **DONE 2026-07-06** (looked good); close-out PR #10 merged
- [x] **R4 content intake — `r4-content` — gate Spec §9.2 — CODE COMPLETE, gated green, PR open (see below).** Content apply to production is the operator loop, still pending.
- [ ] R5 go-live — `r5-golive` — gate Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-06, end of R4 code session)

**R4 (Content Intake, Spec §9, Architecture §7/§4.4/§3.3) code is complete on branch `r4-content` and all gates are green.** Built directly (not via subagent-driven-development this time — smaller, script-heavy milestone); every test suite/build/gate run was delegated to `test-runner`, and a `spec-auditor` whole-branch pass ran before the PR was declared ready. Auditor verdict after the PROGRESS fix below: 0 BLOCKER, 0 MAJOR, 2 MINOR (both addressed or documented). **The two R3 close-out items are now both done** (PR #10 merged; operator's §8.2 preview check passed 2026-07-06), which is what unblocked R4.

Branch commits (off `main` @ `de05f22`):

1. `docs(intake)` — intake formats scaffold (`docs/intake/README.md`, blank `murals.csv`)
2. `build` — `.prettierrc endOfLine: auto` (DECISIONS 033)
3. `feat(db)` — dimension columns + migration `0003`
4. `feat(scripts)` — export + ingest pipeline + tests
5. `docs` — DECISIONS 031–033
6. `docs` — this PROGRESS update + `.gitignore` for the pre-fill sheet (spec-auditor MINOR)

### What R4 built (Spec §9.1, all five items)

- **Item 1 — `scripts/export-catalog-csv.ts`**: reads the paintings table and writes `docs/intake/paintings.csv` pre-filled with every slug + current values, so the operator edits instead of retyping 528 rows. Refuses to overwrite an existing sheet without `--force` (protects hand edits). Reads the configured `TURSO_DATABASE_URL`; the authoritative export is operator-run against production (DECISIONS 031).
- **Item 2 — dimensions migration**: additive nullable `width_in`/`height_in`/`depth_in` (`real`) on `paintings` (`schema.ts` + `drizzle/0003_add_painting_dimensions.sql`, journal/snapshot consistent). Matches Architecture §3.3 verbatim. **Operator applies to production after a backup — never the agent** (§3.4).
- **Item 3 — `scripts/ingest-content.ts` + `scripts/lib/parse-size.ts`**: reads both CSVs; parses `physical_size` → `width_in`/`height_in` accepting only `24x36` / `24 x 36` / `24" x 36"` / `24in x 36in` (+ decimals) and routing everything else (unicode `×`, feet, cm, 3-D, free text) to the error report — **never guesses** (Iron Invariant 3). Updates `availability`/`location`/`series`/`notes` with blank = no change. `--dry-run` default, `--apply` required to write, every run emits `docs/intake/ingest-report-<date>.md` + a structured log line.
- **Item 4 — mural ingest path**: rewrites the `name`/`description`/`year` literals in `src/lib/mural-data.ts` from `murals.csv`; the trail UI un-suppresses names/years by data presence (Architecture §4.4 — no render change, guards already exist). Rewrite runs through prettier's API so the regenerated file passes `format:check`; verified prettier-clean against the real 14-mural file.
- **Item 5 — operator loop**: `docs/intake/README.md` documents both sheet formats, the blank=no-change rule, CSV quoting, and the ritual. Rachel can start filling content now, in parallel — the code is done.

Supporting: hand-rolled quoted CSV reader/writer (`scripts/lib/csv.ts`) and an entrypoint guard (`scripts/lib/entrypoint.ts`, so tests can import script helpers without triggering `main()`). No new dependencies (CSV hand-rolled per Spec §9). Exhaustive tests in `tests/scripts/` (73 tests): size parser (accepted + garbage battery), year parser, CSV round-trip incl. quoted commas/embedded quotes, painting/mural plan builders, `applyPaintingUpdate` against a file DB, and the mural rewrite (prettier-clean assertion).

### R4 gate result (Spec §9.2, this session, `test-runner`-verified, HEAD of `r4-content`)

```
npm run check                        → lint 0/0, format clean, tsc clean, 143 passed (18 test files)
npm run test:coverage                → exit 0, thresholds met (80/80). 89.49% stmts / 84.39% branches /
                                        97.67% funcs / 90.36% lines (scripts covered by targeted tests,
                                        not added to the numeric gate — DECISIONS 032)
TURSO_DATABASE_URL=file:./ci.db \
  npm run db:seed-ci; npm run build  → SSG build succeeds (34 pages), no errors
npx tsx scripts/ingest-content.ts --dry-run → exit 0, clean plan, 0 unresolved parse errors,
                                        report written (murals.csv blank, no paintings.csv yet)
```

### spec-auditor result

**0 BLOCKER, 1 MAJOR, 2 MINOR.**

1. MAJOR — PROGRESS.md was stale (still R3-end + "do not start R4" banner). **Fixed** — this rewrite.
2. MINOR — `docs/intake/paintings.csv` wasn't gitignored, so a `git add -A` could commit dev-DB data. **Fixed** — added to `.gitignore` (reports + `murals.csv` stay committable per Spec §9.2).
3. MINOR — `.prettierrc endOfLine: auto` defers real line-ending normalization to R5. **Documented** (DECISIONS 033) — recommended `.gitattributes eol=lf` renormalization as an R5 hygiene item.

Auditor confirmed all five §9.1 items present + correct, all Iron rules pass (no secrets, no image binaries, `package.json`/lockfile unchanged, coverage thresholds untouched, tests hit only temp file DBs, migration additive-only, honesty preserved — never guesses, blank = no change, `murals.csv` is a blank scaffold with zero fabricated content, `applyPaintingUpdate` parameterizes values).

### Known, deliberately deferred (not blockers)

- **`depth_in` stays NULL this release** — `paintings.csv` (§7.2) has no depth column, so the ingest can't populate it. The AR tool (§13, next release) is what needs depth; flagged there (DECISIONS 032).
- **`photo_filename` is noted, not stored** — no schema/data field for mural photos yet; the ingest lists it in the report rather than dropping it silently. Wiring it up is deferred (DECISIONS 032).
- **Line-ending normalization** — `endOfLine: auto` makes the gate green cross-platform now; a repo-wide `.gitattributes eol=lf` + renormalization commit is the thorough fix, left for R5 (DECISIONS 033).
- **Doc nit from R3, still open** — Architecture §5.2.3's parenthetical "expect `Lilly`" vs production's actual `Lily` (DECISIONS 029). Agent can't edit `docs/`; operator to reconcile.

## Exact next step

**R4 code is done and gated green; open PR #11 for `r4-content` is the deliverable of this session.** The remaining R4 work is the operator loop against production. **Order matters — the migration must precede the merge (see the STOP banner):**

1. Operator: **back up** production Turso, then **apply migration `0003` to production** (`drizzle-kit migrate` per the Architecture §3.4 runbook). Safe for the currently-live site (additive; live `main` selects the old column set). This is the fix for the failed r4-content preview deploy — once the columns exist, the preview rebuilds green.
2. Operator: confirm the `r4-content` **preview deploy is green**, then **review + merge PR #11**. (Merging deploys `main`→production, which now has the columns.)
3. Operator + Rachel: fill `docs/intake/murals.csv` (14 murals) and, after running `npx tsx scripts/export-catalog-csv.ts` against production, fill `docs/intake/paintings.csv`. Filling can start anytime once the formats are merged.
4. Operator: `ingest-content.ts --dry-run` → review the report → `--apply` (after backup) → redeploy. Verify on the preview/production: all 14 murals show real names; spot-check 5 paintings vs the CSV (size, availability). Commit `docs/intake/ingest-report-*.md`.
5. **R5 (go-live) starts only when mural content is real and applied** (Spec §9.2 ship-line note; Iron Invariant 3). Painting-data completeness is NOT gating (unknown availability renders honestly as nothing).

**Note on the preview failure (2026-07-06):** `no such column: width_in` on the r4-content preview is the additive-migration discipline working as intended — the code that references the new columns deployed to a preview reading production Turso before the production migration ran. Not a code defect; resolved by step 1. Recorded as DECISIONS 034.

Not requested this session, left as-is: deleting the merged `r3-collection` branch (R0–R2 precedent was to clean up post-merge).

## Open questions for operator

- None blocking. (When you start R5, re-flag the deferred secret rotation — DECISIONS 013 / Phase 0.1 — before configuring production env vars and the Resend domain.)

---

## Prior-milestone recaps (kept for reference)

**R3 (collection finish, Spec §8, Architecture §2/§5/§12) — MERGED (PR #9, tag `R3`).** Made `/collection` + `/collection/[category]` `force-dynamic`; built `/collection?view=all`; fixed the fused `'LillyOther plants'` tag (DECISIONS 029); honest availability display (`src/lib/availability.ts`); design-language empty states; removed the dead "Coming Soon" contact form; added `prefers-reduced-motion`; component tests + the full Playwright e2e suite (CI Playwright job activated). Operator's §8.2 preview verification completed 2026-07-06. Close-out PR #10 merged.

**R2 (images & performance, Spec §7) — MERGED (PRs #6, #7).** `src/lib/art-url.ts` as the sole URL-assembly point; `next.config.ts` Blob `remotePatterns`; 4 render sites migrated to `next/image` + `artUrl()`; `scripts/sync-art-blob.ts`; Playwright image-budget scaffold. Operator uploaded 1056/1056 images to a Vercel Blob store, verified on a preview. Local/CLI Blob access needs a static token or explicit Development OIDC trust (DECISIONS 027) — relevant if R4 ever re-syncs images.

**R1 (trail correctness, Spec §6) — MERGED (PR #5, tag `R1`); production migration was NOT run at R1 (the old "operator-verified" record was mistaken) — corrected 2026-07-06, DECISIONS 035.** `trail_completions` table (retires the `mural_id = 0` sentinel); race-safe completion (`INSERT … ON CONFLICT DO NOTHING RETURNING`); CSPRNG redemption codes; emails gated on `completionInserted`; content honesty (real location names, fabricated description/year removed — the exact suppression R4 now reverses by data presence). `mural-data.ts` has 14 murals; all range checks derive from `MURAL_LOCATIONS.length`.

**R0 (process retrofit) — MERGED (PRs #3, #4).** Tooling gates, CI (`.github/workflows/ci.yml`), branch discipline, coverage thresholds. Phase-0 secret rotation + branch protection deferred/substituted (DECISIONS 013).

# PROGRESS — byrachelpierce-web

> The agent updates this at the end of EVERY session. The operator verifies it before /clear.

## Milestone status (plan: `docs/FINAL-BUILD-SPEC.md`)

- [ ] **Phase 0** (operator) — not fully closed, but unblocked for R0 per DECISIONS 013 (0.1 and 0.2 are deferred/substituted, not gating). Status as of 2026-07-04:
  - [x] planning PR merged + `planning-docs` tag (confirmed: `origin/main` has the merge commit, tag exists)
  - [x] harness verified (`test-runner`, `spec-auditor`, `vercel-analyst` agents + hooks present in `.claude/`)
  - [ ] **0.1 secrets rotated (Resend + Turso) — DEFERRED, not blocking, must be re-flagged before R5** (`Database Token.txt` still present on disk; rotation not yet confirmed by operator — DECISIONS 013)
  - [ ] **0.2 branch protection — UNAVAILABLE on this GitHub plan; substituted by PR-only discipline** (CLAUDE.md rule 9 — DECISIONS 013)
  - [ ] 0.6 art folder backed up (operator-owned, not independently verifiable by the agent — confirm when done)
  - [ ] 0.7 Vercel previews confirmed (operator-owned, not independently verifiable by the agent — confirm when done)
- [x] R0 process retrofit — branch `r0-process` — gate: Spec §5.2 — **GREEN**, PR not yet opened (see below)
- [ ] R1 trail correctness — `r1-trail` — gate: Spec §6.2 (incl. operator-run production migration)
- [ ] R2 images & performance — `r2-images` — gate: Spec §7.2
- [ ] R3 collection finish — `r3-collection` — gate: Spec §8.2
- [ ] R4 content intake — `r4-content` — gate: Spec §9.2 (murals content gates R5)
- [ ] R5 go-live — `r5-golive` — gate: Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-04, end of R0 session)

**R0 is done on branch `r0-process`, gate green, PR not yet opened.**

Gate result (Spec §5.2, this session, `test-runner`-verified):

```
git diff main --stat -- public/art     → empty (no image binaries)
npm run check                          → lint 0/0, format clean, tsc clean, 24 passed | 1 expected-fail
npm run test:coverage                  → 94.73% stmts / 85.71% branch / 100% funcs / 96.93% lines
                                          (scoped to trail-service.ts + art-service.ts — DECISIONS 016)
npm run db:seed-ci; npm run build      → SSG build succeeds (552 pages against dev.db; also verified
                                          separately against ci.db directly — 44 pages, 20 seeded paintings)
```

Both locally green this session; CI (`.github/workflows/ci.yml`) has not run yet — it runs on the PR once opened.

- **Stranded collection work landed**: two commits (`chore: commit package-lock.json`, `feat: art collection browsing (June work, landed as-is)`), unmodified, `public/art/` never touched. `npx tsc --noEmit` was green before and after.
- **Reconciled with `origin/main`**: merged (CVE-2025-66478 fix, `next` → 15.3.6), then bumped further to `next@15.5.20` — the CVE-fix version itself had accumulated more disclosed HIGH-severity advisories since; operator approved the extra bump live (DECISIONS 014). `next-auth`/`drizzle-orm`/`drizzle-kit` deliberately left untouched (pinned / production-DB-adjacent, out of scope).
- **Tooling added**: ESLint flat config + Prettier (singleQuote, 100 cols — confirmed as the codebase's actual dominant pre-existing style by an aggregate quote-count check, not just the Spec's assertion), `vitest.config.ts` (coverage gate scoped to `trail-service.ts` + `art-service.ts`, DECISIONS 016), `tests/helpers/db.ts` (per-test-file file-DB factory) + `seed-catalog.ts`, `tests/fixtures/catalog.json` (20-painting subset) + `murals.json`, first real tests for `trail-service` (incl. an `it.fails` test documenting the sentinel-row bug — **R1 must flip this to a plain `it` once `trail_completions` replaces the sentinel mechanism**) and `art-service`, `drizzle/0000_baseline_schema.sql` (R0 baseline snapshot — **operator still needs to mark this applied on production** per the OPERATOR-GUIDE R0 baseline procedure, DECISIONS 012), `scripts/seed-ci.ts`, `.github/workflows/ci.yml` (Spec §4.3 verbatim), README rewrite.
- **Local dev machine's Node upgraded 20.17.0 → 20.19.0** (operator-approved live, DECISIONS 017) — vitest 4.x/current ESLint deps needed `require(esm)` support Node didn't stabilize until 20.19. CI is unaffected (`setup-node@v4` pulls a current 20.x patch already).
- **Known live defects** (fixed in R1, documented in Architecture §4.2): sentinel-row status inflation after trail completion (now has a documenting `it.fails` test); `Math.random` codes with ambiguous characters; completion race; wrong timestamps in gallery email. Mural names/descriptions/years on public pages are still fabricated placeholders (Architecture §4.4; real content in R4).
- Data reality unchanged: 0/528 paintings have physical size, 1/528 has availability. Leaked secrets (Resend key in git history, Turso token in `Database Token.txt` at `C:\Code\businessWebsites\byRachelPierce\Database Token.txt`, one level above this repo) — rotation (Phase 0.1) remains operator-deferred (DECISIONS 013); NOT a block on R0–R4, **must be re-flagged before R5**.
- Spec-auditor ran this session (2026-07-04) against `main...r0-process`: 0 BLOCKER, 2 MAJOR (this PROGRESS.md update; a repo-wide ESLint rule disable that got corrected to per-line disables — see DECISIONS 015's correction note), 3 MINOR (a pre-existing duplicate `@tailwindcss/postcss` entry in both `dependencies` and `devDependencies` from the landed stranded work — left as-is per "land as-is, fix nothing," flagged here for R3's quality pass; `src/app/api/**` not yet in the coverage gate, by design per DECISIONS 016; a stale "Database Token.txt" claim in the auditor's own report — false negative, the auditor's tools are sandboxed to the repo dir and that file lives one level above it, so the original DECISIONS 013 claim stands correct).

## Exact next step

1. Operator: review this branch's diff and DECISIONS 013–018, then open the R0 PR (`r0-process` → `main`). CI runs automatically on the PR.
2. Once CI is green and the PR is merged and tagged `r0`: start **R1** (trail correctness) in a fresh Opus 4.8 session — prompt bank "Start a milestone" with n=1. R1 reads Spec §6 + Architecture §3.2, §4, §8.
3. Carry into R1: flip the `it.fails` sentinel-bug test in `tests/lib/trail-service.test.ts` once `trail_completions` lands; mark the R0 baseline migration applied on production per the OPERATOR-GUIDE R0 runbook before R1's own production migration.

## Open questions for operator

- None blocking beyond the DECISIONS veto points (007 — suppressing fabricated mural content pre-R4 — is the one that changes visible behavior; read it deliberately). 013–018 (this session) are informational, not veto points — no action needed unless you disagree with a ruling.
- The `@tailwindcss/postcss` duplicate dependency entry (see above) is cosmetic for now but worth a deliberate look at R3.

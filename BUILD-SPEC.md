# Build specification — byrachelpierce-web takeover (finish R5, ship v1.0.0)

_The self-contained contract for this run. Behavior authority: `docs/SITE-ARCHITECTURE-v2.md`. Process ancestry: `docs/FINAL-BUILD-SPEC.md` (R0–R4 shipped under it; this spec carries its R5 content forward as M1, M2, and M4, and its standing rules verbatim — M3, the admin panel, is new scope added at Gate 1 intake 2026-07-07, DECISIONS D16/D17, contract Architecture v1 §11). Consolidated facts and numbers: `byrachelpierce-web_Architecture_v1.md`. Execution-verified starting state: `TAKEOVER-AUDIT-2026-07-06.md` @ `main` `33f9f4f`. If it is not written in these documents or `DECISIONS.md`, it is not decided. Write-protected once `.chuck/plan-approved` exists._

## Environment setup

- Runtime: Node.js 20.x in CI (ubuntu-latest — the authoritative lane when a version-sensitive result diverges); the Windows 11 dev machine runs Node 24.4.0 (audit-verified, unpinned). M0 adds an advisory `"engines": { "node": ">=20 <25" }` to `package.json`; installing Node 20 locally is the operator's call (DECISIONS D15-R11)
- Package manager: npm (v10 line, bundled with Node 20); lockfile `package-lock.json` committed and authoritative
- System dependencies: git, GitHub CLI `gh` (authenticated), Playwright chromium (`npx playwright install chromium`)
- Bootstrap: `npm ci`
- Environment self-check: `npm run check` (expected: exit 0 — lint 0 warnings, format clean, typecheck clean, 143+ tests pass)
- Env files: `.env.local` (gitignored) with `TURSO_DATABASE_URL=file:./dev.db` active; production creds stay commented below it and are never printed. There is no `.env.test`; local builds/e2e export `TURSO_DATABASE_URL=file:./ci.db` at the shell (audit F1).

## Invariants

1. **The production database is live and holds real data.** Production writes happen only through two sanctioned channels: (a) the operator-authorized, backup-first, additive-only ritual with expected-count verification — schema changes, bulk operations, and admin-flag flips live here; and (b) from M3 on, **row-level painting/tag mutations through the authenticated admin panel** (admin-role DB sessions only, soft-delete only, per Architecture v1 §11 and DECISIONS D17). Destructive/raw SQL at production, hard deletes, or ritual counts that don't match remain an immediate `irreversible-op`/`blocked-gate` escalation. Tests and CI touch `file:` databases only. Agent-runnable production access is read-only probes (`.chuck/probes/`, SELECT/PRAGMA, no cred output) per DECISIONS D8 — agents never write production through the panel or otherwise.
2. **`main` is the deploy branch and moves only by PR on green CI** (branch protection is unavailable on this GitHub plan; PR-only discipline substitutes and has held for PRs #2–#12). Chuck work branches `chuck/M<n>` merge to `chuck/integration` only with a PASS gate artifact on the exact HEAD; `chuck/integration` reaches `main` by operator-merged PR at each checkpoint (DECISIONS D4).
3. **No secret ever enters the repo, logs, or agent output.** Tests send no real email (`resend` mocked; key absent in CI). The two historically leaked credentials are rotated in M0 (protocol HT1) — the leak predates this repo (an executed all-branch sweep found zero secret-shaped strings in history, 2026-07-07); rotation is owed because the values were exposed outside git. The M4 history sweep fails on ANY secret-shaped string, no allowlist. `BLOB_READ_WRITE_TOKEN` lives only in the Vercel dashboard (M3 operator step), never in `.env.local` or agent context.
4. **Public content is honest.** Nothing fabricated renders as fact; unknown availability renders as nothing; ingest never guesses (unparseable input routes to the error report); the trail does not go live with placeholder fiction — M4 (go-live) is hard-blocked on M2's mural-content gate. The admin panel inherits the rule: numeric dimensions blank = unknown, never guessed.
5. **No image binaries in git or in agent context.** `public/art/` stays gitignored; artwork URLs only via `artUrl()`.
6. **Quality floors never drop:** coverage thresholds (80/80 configured; 90.36%/97.67% actual) are never lowered, lint stays at zero warnings, and `next-auth@5.0.0-beta.25` stays exactly pinned (upgrade = escalation).
7. **Dependency freeze:** no new dependency outside this spec's sanctioned list (`@vercel/analytics`, `@lhci/cli` — both M1) without a `spec-amendment` escalation. Lockfile committed; `npm audit --omit=dev --audit-level=high` is a standing gate.

## Testing strategy

- **Test layers:** unit + integration (Vitest, per-test `file:` libSQL DBs, mocked `@/auth` and `resend`), component (@testing-library/react, happy-dom), journey-level E2E (Playwright chromium against a built-and-started seeded site), plus deployed-state production probes (`.chuck/probes/`) — the probes are network-dependent, not deterministic: a persistent outage is a `blocked-gate` escalation with the outage evidence, never a silently-skipped gate. Gate `lane` names where the command executes (`local` = this machine, `ci` = GitHub Actions); network-touching probes are `local`-lane commands.
- **Journey-level E2E:** the critical paths stay covered on the real interface — collection browse/filter/paginate/search, painting page render, trail signed-out state, image request-weight budgets; M1 adds redirect (308) journeys and metadata-uniqueness assertions; M3 adds admin journeys authenticated by a seeded DB session (`db:seed-ci` admin user + session row, Playwright sets the `authjs.session-token` cookie — Architecture v1 §11): anonymous/non-admin 404 on `/admin`, edit-visible-publicly, archive/restore including sitemap exclusion. The create/upload journey is unit-tested with `@vercel/blob` mocked plus a real-upload HT4 row — e2e never fakes a Blob upload as passed.
- **Dependency policy (standing gate):** proprietary product over permissive-licensed deps (MIT/Apache-2.0/BSD/ISC — Steve reviews the tree in M0); lockfile in sync (`npm ci` fails otherwise); vulnerability audit `npm audit --omit=dev --audit-level=high` fails the gate on known-vulnerable production deps. New dependency = escalation (Invariant 7).
- **Dev-secrets protocol:** `.gitignore` already covers `.env*`, `*.db`, `public/art/`, `docs/intake/paintings.csv`; M0 adds `byrachelpierce-web.lnk`. Secrets live in `.env.local` (active dev values) and the Vercel dashboard, nowhere else.
- **Flaky-test policy:** an intermittently failing test is quarantined with a tracked ticket in `PROGRESS.md` History (`flaky:` prefix) — never silently skipped or deleted. Quarantine appears in the milestone report.

## CI

- **Provider:** GitHub Actions — `.github/workflows/ci.yml`, already live and green; **not modified by this run** except if the operator approves gate additions at Gate 1.
- **Triggers:** every push to `main` and every pull request (any base — so PRs into `chuck/integration` and into `main` both run it).
- **Job graph (verbatim, existing):** `npm ci` → lint → format:check → typecheck → `db:seed-ci` → test:coverage → build → playwright install → e2e; env pins `TURSO_DATABASE_URL=file:./ci.db` and CI carries no production or email secrets (invariants enforced by absence).
- **Blocking checks:** the `checks` job must be green on the PR head before any merge to `chuck/integration` or `main`. Never merge red or skipped.
- **Status probe:** `gh run list --branch <branch> --limit 1 --json conclusion --jq .[0].conclusion` (expected `success`).

---

## M0 — Takeover baseline: audit closure, hygiene debts, production verification

### Reading list

- `TAKEOVER-AUDIT-2026-07-06.md` (findings F1–F17 — M0 exists to close them), `SCOPE.md`, `DECISIONS.md` D1–D14.
- `byrachelpierce-web_Architecture_v1.md` §5–§6 (environment truth table, production-ops contract).
- Legacy `DECISIONS-r0-r4.md` entries 013, 028, 033, 034, 035.

### Work items

1. Branch setup: create `chuck/integration` off `main` @ `33f9f4f`; work on `chuck/M0` off `chuck/integration`. Commit the planning package (this spec, gates, probes, state docs, audit, SCOPE.md).
2. `scripts/backup-prod.ts` (+ unit tests, TDD): dated JSON dump of **all app tables** to `backups/` — one `backups/<table>-<YYYY-MM-DD>.json` per table, each a JSON array of row objects (the shape `backup-check.mjs` gates) — read-only, creds from `.env.local` commented lines, never printed; restore procedure documented in the header AND proven by the roundtrip test `tests/backup-restore.roundtrip.test.ts` (seed a local `file:` DB → back it up → restore into a fresh `file:` DB → per-table row counts equal), which is itself an M0 gate (closes F6/F7; refutation R1).
3. Guard the loaded gun: replace `db:push` with `db:push:dev` (+ unit tests, TDD) — a wrapper that refuses when the effective `TURSO_DATABASE_URL` (process env first, then `.env.local`'s active value) is not `file:`, exiting non-zero with output containing the literal token `DB PUSH REFUSED`. Probe-gated by `push-guard` (closes F8; DECISIONS D7; refutation R1).
4. Line-ending renormalization (closes F13, legacy DECISIONS 033): add `.gitattributes` (`* text=auto eol=lf`; binary exceptions: `*.ico`, `*.png`, `*.jpg`, `*.webp`, `*.woff2` marked `binary`), `git add --renormalize .`, set `.prettierrc` `endOfLine: "lf"`, full suite green after.
5. File dispositions (F12): gitignore `byrachelpierce-web.lnk`; move `R3-PLAN.md` to `archive/R3-PLAN.md` (operator may overrule to delete at Gate 1).
6. Tag `R4` at `2c9f15e` and push the tag (operator-authorized; closes F3). Delete merged/closed remote branches per audit §2 list (operator approves the list; closes F11).
7. Re-prove the audit's production verifications on M0's HEAD: `prod-verify` and `alias-smoke` run as M0 gates. (The audit already cleared both — L7/L8 VERIFIED, audit §5; the gate run re-proves them at milestone close, it does not "complete" them. The one genuinely pending audit item, F17's Wix page inventory, is an M1 input the operator supplies at the M0 checkpoint — refutation R3/R12.)
8. Dependency hygiene: dedupe `@tailwindcss/postcss` (F16); Steve's license sweep of the production dependency tree (review dimension, recorded in milestone report).
9. **Operator (HT1, human-hands):** rotate the leaked Resend key + Turso token per `OPERATOR-GUIDE.md` Phase 0.1, update `.env.local`, confirm dev + magic-link still work, delete `Database Token.txt` if it still exists; confirm the `public/art/` backup (0.6) and Vercel previews (0.7). Return the HT1 result form.
10. Operator one-liner (F15): in `docs/SITE-ARCHITECTURE-v2.md` §5.2 list item 3 (line 171), fix `Lilly`→`Lily` — both occurrences on that line (agents cannot edit `docs/`; refutation R10).
11. Node version advisory (refutation R11): add `"engines": { "node": ">=20 <25" }` to `package.json`. CI (Node 20) stays the authoritative lane for any version-sensitive divergence.

### Acceptance gates

| Name              | Lane  | Command                                                                                   | Expected                |
| ----------------- | ----- | ----------------------------------------------------------------------------------------- | ----------------------- |
| check             | local | `npm run check`                                                                           | exit0                   |
| coverage          | local | `npm run test:coverage`                                                                   | exit0                   |
| build-seeded      | local | `bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run db:seed-ci && npm run build"` | exit0                   |
| e2e               | local | `npm run e2e`                                                                             | exit0                   |
| dep-audit         | local | `npm audit --omit=dev --audit-level=high`                                                 | exit0                   |
| eol-clean         | local | `node .chuck/probes/eol-check.mjs`                                                        | contains:EOL OK         |
| push-guard        | local | `node .chuck/probes/push-guard.mjs`                                                       | contains:PUSH-GUARD OK  |
| restore-roundtrip | local | `npx vitest run tests/backup-restore.roundtrip.test.ts`                                   | exit0                   |
| prod-verify       | local | `node .chuck/probes/prod-verify.mjs`                                                      | contains:PROD-VERIFY OK |
| alias-smoke       | local | `node .chuck/probes/alias-smoke.mjs`                                                      | contains:SMOKE OK       |
| tag-r4            | local | `git tag -l R4`                                                                           | contains:R4             |
| rotation-recorded | local | `node .chuck/probes/ht-result-check.mjs .chuck/human-tests/HT1-result.md 7`               | contains:HT OK          |
| ci-green          | ci    | `gh run list --branch chuck/M0 --limit 1 --json conclusion --jq .[0].conclusion`          | contains:success        |

### Escalation triggers

- `prod-verify` reports production state that contradicts legacy DECISIONS 035 (missing migrations, wrong counts) → `blocked-gate`, production remediation is operator territory.
- Renormalization breaks the suite in a way two remediation cycles don't fix → `gate-3-strikes` (the eol debt goes back to the operator rather than being papered over again).
- HT1 not returned → `human-hands` (the run waits; rotation is contractually not deferrable again).
- Network outage persists so `prod-verify`/`alias-smoke` cannot run at all → `blocked-gate` with the outage evidence.

### Definition of done

`chuck/integration` exists and is green; the planning package is committed; every audit finding F1–F16 is closed or explicitly operator-waived at the checkpoint, with the two highest-severity closures probe-proven — the `db:push` guard by the `push-guard` gate and the backup/restore path by the `restore-roundtrip` gate (F17's Wix inventory is an M1 input, not an M0 deliverable); secrets are rotated (HT1 all-Pass); R4 is tagged; the suite, e2e, dep-audit, eol, prod-verify, and alias-smoke gates are green on HEAD; and the operator has merged `chuck/integration` → `main` (deploying the hygiene commits) at the checkpoint.

---

## M1 — R5 code: SEO, redirects, analytics, Lighthouse (Spec §10.1 items 1–4)

### Reading list

- Spec §10 (R5) and Architecture §11 (SEO/analytics baseline), §12 (design language — copy in metadata is public content).
- `byrachelpierce-web_Architecture_v1.md` §4 (budget table), §9 (review dimensions).
- `next.config.ts`, `src/app/layout.tsx`, existing `metadata` exports across `src/app/`.

### Work items

1. `src/app/sitemap.ts` + `src/app/robots.ts` (App Router conventions): all public pages + every published painting page, enumerated from the DB (20 pages under the seeded fixture; the production count is gated at M4 by `sitemap-vs-db`, refutation R6 + D17); trail status/API routes disallowed. Unit tests first; e2e asserts `/sitemap.xml` returns 200 and contains exactly the 20 fixture painting URLs (`/collection/painting/<slug>`), and `/robots.txt` disallows the trail API routes.
2. Metadata audit: unique `title`/`description` per public page, real OG images (painting pages already have them via `webImagePath`); add a vitest/e2e assertion that no two public pages share a title or description.
3. Redirect map: operator supplies the top Wix page URLs (10-minute task — request at the M0 checkpoint; if unavailable, Rosebud — Chuck's standing-crew researcher, present in every run alongside Oliver/Bill/Hodge-Podge and distinct from D9's Closet-specialist roster (DECISIONS D15-R5) — inventories the live Wix site and the operator approves the list). Implement `next.config.ts` `redirects()`; Playwright asserts 308s per mapped URL.
4. `@vercel/analytics` in the root layout (sanctioned dependency).
5. Lighthouse budgets: add `@lhci/cli` (devDependency, sanctioned; DECISIONS D6); assertion config committed at `lighthouserc.json` with **error-level** assertions `categories:performance` minScore 0.85, `categories:accessibility` minScore 0.95, `categories:seo` minScore 0.95 — the `lighthouse-config` gate (`lighthouse-config-check.mjs`) fails unless the config actually asserts, because an LHCI run that only collects exits 0 regardless of score (refutation R13). `npm run lighthouse` runs it against the seeded local build for `/`, `/collection`, the painting page `/collection/painting/matthews-turtle` (first fixture slug), `/murals/trail`; `npm run lighthouse:prod` runs the same assertions against `https://byrachelpierce.com` (used in M4). `/admin` (M3) is exempt from Lighthouse budgets and excluded from the audited URL list.
6. `.chuck/probes/mural-content.ts` finalized (it ships with the package; M1 adds its e2e-adjacent test) so M2's gate is proven runnable before M2 starts.

### Acceptance gates

| Name              | Lane  | Command                                                                                   | Expected                |
| ----------------- | ----- | ----------------------------------------------------------------------------------------- | ----------------------- |
| check             | local | `npm run check`                                                                           | exit0                   |
| coverage          | local | `npm run test:coverage`                                                                   | exit0                   |
| build-seeded      | local | `bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run db:seed-ci && npm run build"` | exit0                   |
| e2e               | local | `npm run e2e`                                                                             | exit0                   |
| lighthouse-config | local | `node .chuck/probes/lighthouse-config-check.mjs`                                          | contains:LHCI CONFIG OK |
| lighthouse        | local | `bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run lighthouse"`                  | exit0                   |
| dep-audit         | local | `npm audit --omit=dev --audit-level=high`                                                 | exit0                   |
| ci-green          | ci    | `gh run list --branch chuck/M1 --limit 1 --json conclusion --jq .[0].conclusion`          | contains:success        |

### Escalation triggers

- Lighthouse Performance < 85 after two remediation cycles → `blocked-gate` with the verbatim scores (do not chase the score by degrading design-language fidelity — Quiche's drift review outranks a two-point Lighthouse win).
- Operator does not supply/approve the Wix URL list → `human-hands` (the redirect map cannot be invented; Invariant 4).
- Any push to add a dependency beyond `@vercel/analytics` + `@lhci/cli` → `spec-amendment`.

### Definition of done

Sitemap, robots, unique metadata, redirect map (operator-approved URLs, 308-tested), analytics, and asserted Lighthouse budgets are merged to `chuck/integration` with all gates green on HEAD; the operator has merged to `main` at the checkpoint and the preview/production deploy is green (this deploy carries no schema changes, so no migration ordering applies).

---

## M2 — Content loop completion: real mural content live (human-hands with Rachel)

_This milestone is mostly human work (legacy Spec §9.2's ship-line condition). The agent side prepares, verifies, and gates; Rachel and the operator supply and apply the content. Painting-data completeness is NOT gating (unknowns render honestly); mural content IS._

### Reading list

- Architecture §7 (content model + intake), §4.4 (honesty rule); `docs/intake/README.md`.
- `OPERATOR-GUIDE.md` §R4 ritual + Chuck addendum; protocol `.chuck/human-tests/HT2-content-loop.md`.
- `scripts/ingest-content.ts`, `scripts/export-catalog-csv.ts`, `scripts/backup-prod.ts` (M0).

### Work items

1. **Operator + Rachel (HT2):** fill `docs/intake/murals.csv` (14 rows: real titles, descriptions, years); run `npx tsx scripts/export-catalog-csv.ts` against production (read-only ritual) and fill `docs/intake/paintings.csv` as far as records allow.
2. **Operator (HT2):** `npx tsx scripts/backup-prod.ts` (backup recorded) → `ingest-content.ts --dry-run` → review the report (zero unresolved parse errors on murals; painting parse errors are acceptable and stay unwritten) → `--apply` → commit the regenerated `mural-data.ts`, the ingest report, and `murals.csv` via PR → merge → production deploy.
3. Agent: verify the applied result — `mural-content` probe (14/14 descriptions in `mural-data.ts` + all 14 titles AND all 14 descriptions present in the deployed HTML, normalized against entity escaping; refutation R7), spot-check ingest report against the CSV, confirm no honesty regressions (`availability` free-text renders as supplied, never invented).
4. Agent: re-run the full suite on the post-content `main` (the mural rewrite touches checked-in code; prettier-clean regeneration is already tested but the gate re-proves it).

### Acceptance gates

| Name                  | Lane  | Command                                                                      | Expected               |
| --------------------- | ----- | ---------------------------------------------------------------------------- | ---------------------- |
| check                 | local | `npm run check`                                                              | exit0                  |
| e2e                   | local | `npm run e2e`                                                                | exit0                  |
| mural-content         | local | `npx tsx .chuck/probes/mural-content.ts`                                     | contains:MURAL GATE OK |
| ingest-report         | local | `bash -c "ls docs/intake/ingest-report-*.md"`                                | exit0                  |
| backup-before-apply   | local | `node .chuck/probes/backup-check.mjs`                                        | contains:BACKUP OK     |
| content-loop-recorded | local | `node .chuck/probes/ht-result-check.mjs .chuck/human-tests/HT2-result.md 8`  | contains:HT OK         |
| ci-green              | ci    | `gh run list --branch main --limit 1 --json conclusion --jq .[0].conclusion` | contains:success       |

### Escalation triggers

- Rachel's content is not available on any near horizon → `human-hands` escalation stating plainly that M4 (go-live) is blocked by Invariant 4; there is no placeholder fallback, by design. The escalation answer MAY reorder M2↔M3 via `/chuck:change` (the panel consumes no mural content) — but the ingest ritual assumes a single writer, so if reordered, the panel must not open to admins until the content loop's `--apply` has run (D16).
- The ingest `--apply` result diverges from the reviewed `--dry-run` plan → `blocked-gate` with both reports attached (and the backup ready).
- Any pressure to loosen the parser to "get the sizes in" → `spec-amendment` (it never guesses; Invariant 4).

### Definition of done

All 14 murals show real titles and descriptions on the production deploy (probe-verified in code and in deployed HTML, operator-attested as Rachel's real content in HT2); the ingest report and backup records are committed; the suite is green on the post-content `main`. The go-live blocker is lifted.

---

## M3 — Admin panel: non-developer collection CRUD (added at Gate 1 intake; D16/D17; contract Architecture v1 §11)

_New scope, operator-directed 2026-07-07: the ops manager (Laciey) must be able to edit and QC the painting collection through an admin panel BEFORE cutover. Full population control: field/tag edits, soft-delete archive/restore, create with pre-processed image upload. Runs after M2 so the single-writer CSV ingest era ends before the panel becomes a second writer to `paintings`._

### Reading list

- `byrachelpierce-web_Architecture_v1.md` **§11 — the complete behavior contract for this milestone**; DECISIONS D16/D17.
- `src/db/schema.ts` (users/paintings/tags shapes), `scripts/seed-ci.ts` (e2e seam lands here), `docs/SITE-ARCHITECTURE-v2.md` §12 (design language — the panel is still this site).
- Legacy `DECISIONS-r0-r4.md` 034 (migration-before-code ordering).

### Work items

1. Migration `drizzle/0004_add_admin_and_archive.sql` (additive only: `users.is_admin` INTEGER NOT NULL DEFAULT 0; `paintings.archived_at` TEXT NULL) + `src/db/schema.ts` update. **The operator runs it at production, backup-first, BEFORE the code that reads the columns merges** (legacy DECISIONS 034 ordering; the PR carries a §R1-pattern runbook with expected counts).
2. `requireAdmin()` helper (DB-session `is_admin` check, `notFound()` on failure) + `scripts/set-admin.ts <email> <0|1>` — TDD; at production the script is an operator-run ritual write.
3. Archived-exclusion sweep: every public read path (collection, category pages, painting page, search, tag counts, sitemap) filters `archived_at IS NULL` — unit tests first; e2e asserts an archived painting vanishes from `/collection` and `/sitemap.xml` and its URL 404s.
4. `/admin` list (search title/slug, live/archived filter) + edit form (fields per §11, slug immutable, tag attach/detach + new-tag-in-category) + archive/restore — Server Actions with `requireAdmin()` first line, revalidation set per §11, TDD.
5. Create + upload: two pre-processed JPEGs → Blob (`web/<slug>-<hash8>.jpg`, `thumbs/<slug>-<hash8>.jpg`; caps 600 KB / 200 KB; content-type validated), JPEG SOF px parser util (TDD, **no new dependency**), slug generation with collision suffix, orientation derivation — per §11.
6. E2E seam + admin journeys per the Testing strategy (seeded admin user + session row; `authjs.session-token` cookie); `/admin` robots-disallowed, noindex, sitemap-excluded.
7. **Operator:** Resend domain verification (SPF + DKIM — moved earlier from cutover so magic links reach all three admin inboxes); add `BLOB_READ_WRITE_TOKEN` to the Vercel production env; after the production migration, run `set-admin` for matthew/rachel/laciey @byrachelpierce.com (ritual write). Confirm each admin can request a magic link on the deployed alias.

### Acceptance gates

| Name          | Lane  | Command                                                                                   | Expected                 |
| ------------- | ----- | ----------------------------------------------------------------------------------------- | ------------------------ |
| check         | local | `npm run check`                                                                           | exit0                    |
| coverage      | local | `npm run test:coverage`                                                                   | exit0                    |
| build-seeded  | local | `bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run db:seed-ci && npm run build"` | exit0                    |
| e2e           | local | `npm run e2e`                                                                             | exit0                    |
| dep-audit     | local | `npm audit --omit=dev --audit-level=high`                                                 | exit0                    |
| admin-schema  | local | `node .chuck/probes/admin-schema.mjs`                                                     | contains:ADMIN SCHEMA OK |
| admin-lockout | local | `node .chuck/probes/admin-lockout.mjs`                                                    | contains:LOCKOUT OK      |
| ci-green      | ci    | `gh run list --branch chuck/M3 --limit 1 --json conclusion --jq .[0].conclusion`          | contains:success         |

_Gate note (refutation Δ5): at M3 gate-time the deployed alias does not yet carry the panel (the checkpoint merge deploys it), so `admin-lockout` passes vacuously there — the **load-bearing M3-time lockout proof is the e2e anonymous-404 journey** against the built panel; the probe is belt-and-suspenders that becomes load-bearing at the M3 checkpoint deploy and at M4 (`admin-lockout-prod`)._

### Escalation triggers

- Production migration ordering violated, or post-migration verification counts mismatch → `irreversible-op`/`blocked-gate` (production remediation is operator territory).
- Magic links not delivering to an admin inbox after domain verification → `blocked-gate` (Resend domain config is the usual suspect; do not restructure auth).
- Any push to add a dependency (image library, form library, admin framework) → `spec-amendment` — the JPEG parser is hand-rolled and `@vercel/blob@2.5.0` is already present; the sanctioned-list stands.
- Any pressure for hard delete, admin-management UI, or slug editing → `spec-amendment` (D16 excludes all three from this release).

### Definition of done

Migration 0004 is live at production (probe-verified read-only) with the code merged AFTER it; the panel is deployed on the alias; all three admins are flagged and can request magic links; `admin-lockout` proves anonymous `/admin` is never 200; admin e2e journeys and the full suite are green on HEAD; the operator has merged `chuck/integration` → `main` at the checkpoint (deploying the panel) so ops-manager QC (HT4, gating M4) can begin.

---

## M4 — Go-live: cutover, smoke, v1.0.0 (Spec §10.1 items 5–7 + §10.2)

_Operator-heavy by design; the agent prepares checklists and verifies outcomes, the operator performs every credentialed and DNS step. Rollback for the cutover: repoint DNS to Wix (TTL lowered to 300 the day before); Wix stays warm for a week._

### Reading list

- `OPERATOR-GUIDE.md` §R5 runbook end-to-end (the operator reads it BEFORE starting) + Chuck addendum; protocol `.chuck/human-tests/HT3-cutover-smoke.md`.
- Spec §10.1 item 5 (env checklist), §10.2 (gate), §14 (Definition of Done); Architecture §8 (email cutover).

### Work items

1. **Operator + ops manager (HT4) — BEFORE any DNS step:** Laciey's QC pass of the whole site through the admin panel on the deployed alias (all three admins sign in; edit/archive/create exercised for real, including one real image upload; collection QC'd) — protocol `.chuck/human-tests/HT4-admin-qc.md`. Cutover is hard-blocked on the returned all-Pass form.
2. **Operator:** Vercel production env checklist — all §4.5 production values with the M0-rotated secrets, strong `AUTH_SECRET`, Blob token (`BLOB_READ_WRITE_TOKEN` confirmed present since M3), `EMAIL_FROM` on the verified domain, real `GALLERY_EMAIL`, `NEXTAUTH_URL=https://byrachelpierce.com`.
3. **Operator:** confirm Resend domain verification is still green (SPF + DKIM were verified in M3 for the admin magic-links; nothing to re-do unless DNS host changed).
4. **Operator (HT3):** DNS cutover per runbook — TTL 300 a day ahead → point apex + www at Vercel → cert + www-redirect verification → execute the smoke matrix (every nav link; trail magic-link round trip on a phone to a non-owner inbox; collection filter journey; painting page; 3 Wix-redirect spot checks; `/admin` reachable for an admin over the real domain) and return the form.
5. Agent: `domain-live` probe (apex 200 via Vercel, www redirects), `sitemap-vs-db` probe (live sitemap painting URLs === production non-archived painting count — refutation R6 + D17), `admin-lockout` re-run against the real domain, `lighthouse:prod`, secret-history sweep, and the full local suite one final time.
6. Tag `v1.0.0` on the shipped `main` commit; flip `PROGRESS.md` to shipped; Milo assembles the ship report (`/chuck:ship`, Gate 2); DECISIONS review sweep.

### Acceptance gates

| Name                  | Lane  | Command                                                                                    | Expected                |
| --------------------- | ----- | ------------------------------------------------------------------------------------------ | ----------------------- |
| check                 | local | `npm run check`                                                                            | exit0                   |
| e2e                   | local | `npm run e2e`                                                                              | exit0                   |
| domain-live           | local | `node .chuck/probes/domain-live.mjs`                                                       | contains:DOMAIN OK      |
| sitemap-vs-db         | local | `node .chuck/probes/sitemap-vs-db.mjs`                                                     | contains:SITEMAP-DB OK  |
| admin-lockout-prod    | local | `bash -c "ADMIN_BASE_URL=https://byrachelpierce.com node .chuck/probes/admin-lockout.mjs"` | contains:LOCKOUT OK     |
| lighthouse-config     | local | `node .chuck/probes/lighthouse-config-check.mjs`                                           | contains:LHCI CONFIG OK |
| lighthouse-prod       | local | `npm run lighthouse:prod`                                                                  | exit0                   |
| secret-sweep          | local | `node .chuck/probes/secret-sweep.mjs`                                                      | contains:SWEEP CLEAN    |
| admin-qc-recorded     | local | `node .chuck/probes/ht-result-check.mjs .chuck/human-tests/HT4-result.md 10`               | contains:HT OK          |
| smoke-matrix-recorded | local | `node .chuck/probes/ht-result-check.mjs .chuck/human-tests/HT3-result.md 12`               | contains:HT OK          |
| v1-tag                | local | `git tag -l v1.0.0`                                                                        | contains:v1.0.0         |
| ci-green              | ci    | `gh run list --branch main --limit 1 --json conclusion --jq .[0].conclusion`               | contains:success        |

### Escalation triggers

- Any smoke-matrix row fails → `blocked-gate` with the operator's observed values; rollback guidance (repoint DNS to Wix) attached if user-facing.
- Production emails do not deliver to a non-owner inbox → `blocked-gate` (Resend domain verification is the usual suspect; do not restructure auth).
- The sweep finds any secret-shaped string in history → `irreversible-op` escalation (rotation decision is the operator's).
- Anything requiring a production DB write outside the panel's sanctioned surface → `irreversible-op` (none is planned in M4; admin edits during QC are the panel's normal operation).

### Definition of done

`byrachelpierce.com` serves the site from Vercel with cert and www redirect; Wix redirects work; the ops-manager QC (HT4) and the smoke matrix (HT3) returned all-Pass with dates/initials; production email proven delivered to a non-owner inbox; Lighthouse budgets green against production; the live sitemap's painting URLs equal the production non-archived count (probe-verified); `/admin` locked to anonymous traffic on the real domain; secret sweep clean; `v1.0.0` tagged; ship report assembled and awaiting the operator's Gate 2. Legacy Spec §14's Definition of Done is satisfiable line by line.

---

## Post-launch

- **Update pipeline:** fix/feature → `chuck/`-prefixed branch → PR with green CI → operator-merged to `main` → Vercel auto-deploy. Schema changes keep the additive-only, migrate-production-first discipline (Architecture v1 §3). `master` does not exist in this repo; `main` is the protected trunk and moved only through PRs (DECISIONS D4).
- **Wix retirement:** after one week of green production, the operator cancels Wix (their explicit action; nothing in the repo depends on it).
- **Triage ritual:** weekly pass — reproduce, ticket in PROGRESS History, fix through the pipeline or log as a known gap; drain any flaky-test quarantine tickets. Trail stats via the libsql standing queries (OPERATOR-GUIDE Chuck addendum).
- **Named next release:** the AR sizing tool (Architecture §13, fully specced) — a fresh `/chuck:plan` scope when the operator green-lights it.

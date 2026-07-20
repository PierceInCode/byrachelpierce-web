<!-- chuck SCOPE — byrachelpierce-web TAKEOVER; an ONGOING project in progress. Chuck's planning MUST run audit-first: review the git repo, run the real suites, and verify every claimed state before planning a single work item. -->

# Scope — byrachelpierce-web (takeover: finish R5 and ship v1.0.0)

**THIS IS AN ONGOING PROJECT, HEAVILY IN PROGRESS — NOT A GREENFIELD.** Milestones R0–R4 are merged and deployed; a live production database holds real data. The planner's first obligation is the audit: **review the git repository** (branches, PR history, default-branch situation, uncommitted files), run the project's real gates, and verify what the state documents claim against execution. Precedent inside this very repo: PROGRESS once recorded R1's production migration as operator-verified when it had never been applied — discovered and corrected 2026-07-06 (DECISIONS 035). Treat every "done" claim accordingly: verified or re-verified, never trusted.

_Governing documents already exist and are the behavior/process authority — the plan builds on them, never re-invents them:_

- `docs/SITE-ARCHITECTURE-v2.md` — behavior contract (incl. design language §12, AR tool spec §13)
- `docs/FINAL-BUILD-SPEC.md` — process contract: milestones R0–R5, quality gates, CI, engineering rules
- `PROGRESS.md` / `DECISIONS.md` (035 entries) — live state + judgment-call log (verify-first)
- `OPERATOR-GUIDE.md`, `CLAUDE.md` — operator runbook + standing orders

## What & why

Marketing and experience website for the **by Rachel Pierce** art gallery on Sanibel Island (1571 Periwinkle Way): Rachel's 528-painting collection, her 14 island murals, and the gamified **Mural Selfie Trail** with magic-link auth. E-commerce is external (Lightspeed) — this site sells the visit, not the checkout.

**The job to be done now:** carry the project from its current state (R4 merged + deployed; production migrated 0001–0003; R4 _content_ loop pending with Rachel) through **R5 go-live** to a verified, publicly serving **v1.0.0** — with the deferred pre-launch debts actually resolved, not re-deferred. The one job that makes it pointless if missed: the site live on the real domain with the trail working against production and **all 14 murals showing real names** (Iron Invariant: the trail may not go live with placeholder fiction).

**Scope addition (operator, 2026-07-07, pre-Gate-1):** an **admin panel** for non-developer CRUD over the painting collection, shipping **in this run, before cutover** — the ops manager must edit and QC the site through it before DNS moves. Full population control: edit any painting's fields and tags, archive duplicates (soft-delete, restorable), and create new paintings by uploading pre-processed images (Photoshop pipeline produces files that already fit the existing web/thumb requirements) plus title, a description (stored in the existing `notes` column — there is no `description` column), tags, and dimensions in inches. Admins: Matthew, Rachel, Laciey (byRachelPierce.com addresses), authenticated by the existing magic-link flow plus an admin flag; admin management is a CLI/operator action, never a UI surface. Full design contract: Architecture v1 §11; judgment ledger: DECISIONS D16/D17.

## Audience

**Primary:** gallery visitors and Sanibel tourists on phones — browsing the collection, walking the mural trail outdoors, tapping check-ins on weak signal.
**Secondary:** Rachel (content owner — the CSV intake loop is hers), Laciey (ops manager — QCs and maintains the painting collection through the admin panel), and the operator (deploys, secrets, production rituals, admin-flag CLI).
**Tertiary:** returning trail players with accounts (Auth.js magic-link sessions must keep working across the launch).

## Platform & domain

- [x] **web** — browser app or site
- ~~API~~ · ~~mobile~~ · ~~game~~ · ~~IoT / embedded~~

Domain specifics the checklists must honor:

- **LIVE PRODUCTION DATABASE** (Turso libSQL; the same DB Vercel Production serves). Iron Rule 1 posture: production is never touched without an operator-authorized, backup-first ritual; migrations are additive-only. Backups land in `backups/`.
- **Content honesty invariants (existing, binding):** ingest never guesses (unparseable sizes route to the error report), blank = no change, zero fabricated content, no secrets and no image binaries in git.
- **Auth.js v5 is a pinned beta** + Resend magic-link email — treat as a fragile seam; verify, don't upgrade casually.
- **Images live on Vercel Blob** (`NEXT_PUBLIC_ART_BASE_URL`); local dev serves from gitignored `public/art/`.
- **CI** (`.github/workflows/ci.yml`) runs the standard gate on pushes/PRs; branch protection is UNAVAILABLE on this GitHub plan — PR-only discipline substitutes (DECISIONS 013).
- **Git reconciliation item for Gate 1:** the repo's default branch is `main`, and CI + Vercel are wired to it. The operator's standing rule everywhere else is `master`-only. Chuck must NOT unilaterally rename a live wired branch — surface the conflict as an explicit audit finding with a recommendation, and let the operator rule at Gate 1.
- Two untracked files sit in the working tree at scope-writing time (`R3-PLAN.md`, a `.lnk`) — audit and disposition them.

## Constraints

- **Budget:** token budget — no hard ceiling; checkpoint mode bounds unattended spend per milestone; Otis estimates at planning. Cash: existing accounts only, no new paid services.
- **Timeline:** no hard deadline, but R5 is the LAST planned milestone — the takeover scope is "finish and ship," not "expand."
- **Accounts on hand (all operator-held):** Vercel (hosting + Blob), Turso (production DB), Resend (email), GitHub, byrachelpierce.com domain. **Secret rotation for Resend + Turso was deferred at Phase 0.1 and is contractually re-flagged before R5 (DECISIONS 013) — it must appear in the plan as a pre-launch operator step.**

## Inspirations

Not applicable — the design language already exists (Architecture §12) and the site is built to it. The plan inherits it; drift from the existing design language is a defect, not a choice.

## Already decided

1. **The existing governing docs govern.** SITE-ARCHITECTURE-v2 is the behavior authority; FINAL-BUILD-SPEC's R5 gate (§10.2 + smoke matrix) is the ship gate's content. Chuck's machinery wraps them; it does not replace them.
2. **Stack is pinned as-is:** Next.js 15.5.x App Router, React 19, TypeScript strict, Tailwind v4 CSS-first tokens, Drizzle + Turso, Auth.js v5 (pinned beta), Resend, Leaflet, Vercel + Blob. No new runtime dependencies without escalation (existing spec posture; R4 hand-rolled CSV rather than add one).
3. **Existing quality gates stay and stay green:** `npm run check` (lint 0-warnings, format, typecheck, Vitest), coverage thresholds 80/80 untouched, `db:seed-ci` + build, Playwright e2e. Chuck's gates.json wraps these real commands.
4. **Production ritual:** backup → operator authorization → apply → verify, for anything touching production data. The agent side prepares and verifies; the operator authorizes.
5. **The R4 content loop is operator+Rachel human-hands** (fill CSVs → `export-catalog-csv` prod → `ingest-content --dry-run` → reviewed `--apply` after backup → redeploy → verify 14 real mural names). Chuck plans around it as a human-hands protocol with a definition of done — he cannot author Rachel's content.
6. **Pre-R5 hygiene debts land in the plan, not in a new deferral:** secret rotation (0.1), `.gitattributes` eol=lf renormalization (DECISIONS 033), art-folder backup confirmation (0.6), Vercel preview confirmation (0.7).
7. **PR-only workflow continues** (no direct pushes to the default branch), with merges through Chuck's gate discipline.

## Success criteria

1. **Audit report first (the takeover gate):** every PROGRESS/DECISIONS "done" claim re-verified by execution or explicitly listed as unverifiable; the real suites run with verbatim results; git state (branches, PRs, untracked files, default-branch conflict) inventoried with recommendations. The "things the operator believes that are not actually true" list is present even if empty.
2. **All existing gates green at takeover baseline and at every milestone after:** `npm run check` clean (currently 143 tests / 18 files), coverage ≥ 80/80 thresholds, seeded build succeeds (34 pages), e2e passes.
3. **R5 go-live per Spec §10.2 + smoke matrix, machine-checkable where the spec defines it,** ending in tag `v1.0.0` and verified public serving on the production domain (key routes return 200 and render real content).
4. **The 14 murals show real names on the deployed site** before go-live is called done (content-loop completion is a human-hands protocol with this as its observable exit).
5. **No deferred-debt laundering:** secrets rotated (operator step, recorded), eol renormalization done, art backup + preview confirmations recorded — or each carries an explicit operator-accepted waiver in the ship report.
6. **Production-data safety:** zero unauthorized production writes across the whole run; every production touch traceable to a backup + authorization record.
7. **Honest state docs at ship:** PROGRESS/DECISIONS reflect execution-verified reality (the DECISIONS-035 standard), and the ship report's coverage manifest says plainly what was NOT checked.
8. **Admin panel observable pass (added 2026-07-07):** each allowlisted admin can sign in on the deployed site via magic link and reach `/admin`; an unauthenticated or non-admin request to `/admin` gets 404, never content (probe `admin-lockout`); an admin edit to a painting's title is visible on its public page after revalidation; an archived painting disappears from `/collection` and the sitemap and is restorable; a created painting (uploaded web+thumb images + fields) renders publicly; the live sitemap's painting-URL count equals the DB's non-archived count (probe `sitemap-vs-db`). Ops-manager QC recorded via protocol HT4.

## Intake settlements

_Chuck fills this section DURING intake, not the operator._

- **License:** Proprietary (all rights reserved) — commercial client site; no OSS license file. Dependency review still verifies all third-party licenses permit commercial use. (Operator-selected at intake, 2026-07-06.)
- **Dependency allowlist:** Approval-required — dependencies frozen to `package.json` + lockfile, pinned versions; any new dependency is a build-time escalation. (Fact-mandated by Already-decided #2; not a veto point.)
- **Jira:** Off — PROGRESS.md is the sole status surface. (Operator-selected at intake, 2026-07-06.)
- **Notifications:** In-session only — checkpoint pauses and escalations surface in the session and in PROGRESS.md / ESCALATIONS.md. (Operator-selected at intake, 2026-07-06.)
- **Execution mode:** Checkpoint (intake preference; operator confirms at Gate 1 by writing `.chuck/mode`). (Operator-selected at intake, 2026-07-06.)

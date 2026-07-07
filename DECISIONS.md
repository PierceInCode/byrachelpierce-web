# Decisions — byrachelpierce-web takeover (finish R5, ship v1.0.0)

**The veto contract.** This file is the ledger of every judgment call Chuck made while planning this takeover run. **Nothing executes until you have read it.** Approving the plan at Gate 1 means approving these decisions; `/chuck:run` refuses to start until `.chuck/plan-approved` exists, and only you create that marker. Read it like it owes you money.

`VETO POINT: yes` means a close call reasonable people would differ on — overrule freely. `VETO POINT: no` means settled by your scope or by verified fact, recorded for transparency.

**Continuity note:** this project's prior ledger (entries 001–035, R0–R4 era) is archived **verbatim and unedited** at `DECISIONS-r0-r4.md`; entries below cite it as "legacy 0NN". The execution-verified audit these decisions rest on is `TAKEOVER-AUDIT-2026-07-06.md`.

---

## D1 — Audit-first takeover mode

**Decision:** Planning ran in audit-first mode: real suites executed, git/CI/tag state inventoried, production claims re-verified or explicitly flagged pending, before any work item was written. Results in `TAKEOVER-AUDIT-2026-07-06.md`.

**Why:** The folder holds live source with a production database, and this repo's own history proves "DONE" records lie (legacy 035: R1's production migration was recorded operator-verified and had never run). SCOPE mandates it.

**Alternatives rejected:** Greenfield planning — factually wrong for a project with R0–R4 shipped.

VETO POINT: no

## D2 — The existing governing docs remain the authority

**Decision:** `docs/SITE-ARCHITECTURE-v2.md` stays the behavior contract and `docs/FINAL-BUILD-SPEC.md` the process ancestry; the Chuck package (root `BUILD-SPEC.md`, `byrachelpierce-web_Architecture_v1.md`, `.chuck/gates.json`) wraps them, carries R5's content as M1–M3, and never contradicts them. Agents still never edit `docs/`.

**Why:** SCOPE "Already decided" #1. Re-inventing a proven contract mid-ship is pure risk.

**Alternatives rejected:** Superseding the docs with a fresh architecture — churn without benefit; the site is built to the existing contract.

VETO POINT: no

## D3 — Ledger reconciliation: archive-and-continue, never overwrite

**Decision:** Legacy `DECISIONS.md` (001–035) → `DECISIONS-r0-r4.md` and legacy `PROGRESS.md` → `PROGRESS-r0-r4.md`, both moved with `git mv` (history follows), content untouched. Root `DECISIONS.md`/`PROGRESS.md` are now Chuck-format. `OPERATOR-GUIDE.md` keeps its full existing content with Chuck sections appended.

**Why:** Chuck's machinery (package checker, gate hooks, Milquetoast) requires its formats at these exact paths, and the legacy ledgers are an audit trail that must survive intact. Renaming preserves both.

**Alternatives rejected:** (a) Appending Chuck entries into the legacy format — fails the package checker and muddles two numbering schemes; (b) parallel `CHUCK-DECISIONS.md` — two live ledgers guarantee drift; (c) rewriting the legacy files — destroys the audit trail (never).

VETO POINT: yes

## D4 — Branch model: keep `main`, insert `chuck/integration`, PR-only to `main`

**Decision:** The default branch stays `main` through v1.0.0 (audit F5 recommendation — CI triggers, Vercel production, and the remote HEAD are all wired to it; renaming a live wired branch mid-ship is risk for zero functional gain). `chuck/integration` is created off `main`; work happens on `chuck/M<n>` branches merged to `chuck/integration` on PASS gate artifacts; `chuck/integration` reaches `main` only by an operator-merged PR at each checkpoint (which is also the production deploy). No `master` branch is created; where Chuck's conventions say "master moves at ship", read "the final checkpoint PR to `main` + tag `v1.0.0`".

**Why:** Preserves both regimes: the operator's PR-only discipline (held for PRs #2–#12) and Chuck's always-green integration branch. Deploys must reach `main` mid-run (M1 code, M2 content), so a ship-only trunk move would not work here.

**Alternatives rejected:** (a) Renaming `main`→`master` — operator's standing preference elsewhere, but breaks CI/Vercel wiring mid-ship (revisit post-v1.0.0 if wanted); (b) dropping `chuck/integration` and PRing `chuck/M<n>` straight to `main` — simpler, one less merge layer, but loses the gate-artifact merge-block that makes the run auditable. If you prefer (b), say so at Gate 1; it is workable.

VETO POINT: yes

## D5 — Milestone structure: M0 baseline → M1 R5-code → M2 content → M3 cutover

**Decision:** Four milestones. M0: audit closure + hygiene debts + production re-verification + secret rotation. M1: Spec §10.1 items 1–4 (sitemap/robots/metadata, Wix redirects, analytics, Lighthouse). M2: the operator+Rachel content loop with real mural content live (legacy Spec §9.2 ship-line condition). M3: env/Resend/DNS cutover + smoke matrix + `v1.0.0` (Spec §10.1 items 5–7, §10.2).

**Why:** Dependency order is real: M3 is hard-blocked on M2 (Invariant 4 — no placeholder fiction at go-live) and on M0's rotation (new secrets go into the M3 env checklist). M1 is pure code and can't slip past cutover. Splitting content (M2) from cutover (M3) keeps the human-hands long pole from blocking reviewable code work.

**Alternatives rejected:** (a) One monolithic "R5" milestone — hides the human-hands dependency and makes checkpoint pauses meaningless; (b) folding hygiene into M1 — audit closure deserves its own gate so the takeover baseline is provably green before new code lands.

VETO POINT: yes

## D6 — Lighthouse tooling: `@lhci/cli`

**Decision:** `@lhci/cli` (devDependency, pinned) implements `npm run lighthouse` (local seeded build) and `npm run lighthouse:prod` (real domain), asserting Performance ≥ 85 mobile / Accessibility ≥ 95 / SEO ≥ 95 on `/`, `/collection`, one painting page, `/murals/trail`.

**Why:** Legacy Spec §10 sanctions `@lhci/cli` or `unlighthouse` and requires the choice recorded. LHCI has first-class assertion config (budgets fail the command — exactly the machine-runnable gate shape), runs headless in CI, and is the maintained first-party tool.

**Alternatives rejected:** `unlighthouse` — nicer dashboard, weaker assertion story; the gate needs exit codes, not dashboards.

VETO POINT: yes

## D7 — Disarm `npm run db:push`

**Decision:** M0 replaces `db:push` with `db:push:dev`, a wrapper that refuses to run when the effective `TURSO_DATABASE_URL` is not a `file:` URL.

**Why:** Audit F8: `drizzle-kit push` reads `.env.local`, which carries production creds commented one line below the dev default — during content-loop/migration ops (creds temporarily uncommented) the existing script pushes schema straight at live production, the precise act Iron Rule 1 bans.

**Alternatives rejected:** (a) Deleting the script — loses a legitimate dev convenience; (b) leaving it with a warning comment — warnings don't stop a typo at 11pm.

VETO POINT: yes

## D8 — Agent-runnable read-only production probes are sanctioned

**Decision:** Scripts under `.chuck/probes/` may read production: SELECT/PRAGMA against Turso (creds parsed from `.env.local`'s commented lines, never printed, never entering agent context) and anonymous HTTPS against the deployed site. They are gates (M0 `prod-verify`/`alias-smoke`, M2 `mural-content`, M3 `domain-live`). All production **writes** remain operator-authorized, backup-first, additive-only — unchanged.

**Why:** The audit's centerpiece obligation (SCOPE success criterion 1, and this repo's legacy-035 precedent) is _verify the live state, trust no record_. Without sanctioned read-only probes, every verification claim regresses to "someone said so." The R3-era posture ("never production Turso, even read-only, from an automated script") was written for tests/CI — which still touch only `file:` DBs.

**Alternatives rejected:** Operator-run manual verification per milestone — slower, error-prone, and historically exactly how "operator-verified" fictions entered the record.

VETO POINT: yes

## D9 — Roster: web specialist set; no Jira mirror; design language inherited, not re-authored

**Decision:** Core team plus the web set: **Lola** (SEO/content), **Steve** (security/compliance), **Cutter** (a11y/UX), **Portnoy** (performance), **Quiche** (design drift). No **Thornhump** (Jira declined at intake — `PROGRESS.md` is the sole status surface). No **the Major** (no IoT). The `frontend-design` companion is installed but was **not invoked** to author a design language: Architecture §12 already is the complete design language and SCOPE freezes it ("drift is a defect, not a choice"); Quiche reviews drift against §12, and Oliver may consult the companion without overriding §12.

**Why:** Domain mapping per the roster catalog; intake settlements; authoring a second design language for a built site would manufacture the very drift Quiche exists to catch.

**Alternatives rejected:** Invoking `frontend-design` to restate §12 — a transcription exercise with drift risk and no new information.

VETO POINT: no

## D10 — Dependency policy: approval-required; two pre-approved additions; `npm audit` standing gate

**Decision:** Dependencies stay frozen to `package.json` + lockfile. Pre-approved for this run, both legacy-Spec-sanctioned: `@vercel/analytics` (runtime) and `@lhci/cli` (dev). Anything else = `spec-amendment` escalation. New standing gate: `npm audit --omit=dev --audit-level=high` must exit 0. Product license: **proprietary** (intake); Steve verifies in M0 that the production dependency tree is permissive-licensed (MIT/Apache-2.0/BSD/ISC) for commercial use.

**Why:** SCOPE "Already decided" #2 + intake settlements. The audit gate is the one addition: Architecture §10.4 demands CVE triage, and a machine gate beats remembering (audit L9 found the last CVE PR handled by accident of a version bump, not by process).

**Alternatives rejected:** A license-checker dependency for the license sweep — adding a dep to police deps; Steve's one-time M0 review suffices at this tree size.

VETO POINT: yes

## D11 — Secret rotation executes in M0, not at cutover

**Decision:** The twice-deferred rotation (Resend key + Turso token, legacy 003/013) is M0 protocol HT1 with a machine gate on its returned result form. M3's env checklist then uses the new values. Not deferrable again: SCOPE success criterion 5 names rotation explicitly, and M0's definition of done includes it.

**Why:** Both credentials are leaked-by-precedent and live. Every week they stay valid is unnecessary exposure; rotating at cutover couples a security fix to the release's busiest day.

**Alternatives rejected:** Rotation inside M3's checklist — the historical pattern that produced two deferrals; "before R5" without a gate is how it slipped twice.

VETO POINT: yes

## D12 — Untracked-file dispositions

**Decision:** `R3-PLAN.md` → committed at `archive/R3-PLAN.md` (it documents how R3 was actually built; never previously committed). `byrachelpierce-web.lnk` → gitignored, left on disk (operator's shortcut). `SCOPE.md` → committed with the package (it is the run's charter).

**Why:** Audit F12; nothing is silently deleted.

**Alternatives rejected:** Deleting `R3-PLAN.md` — cheap disk space vs. lost engineering record; overrule at Gate 1 if you prefer deletion.

VETO POINT: yes

## D13 — Intake settlements (recorded)

**Decision:** License: proprietary, all rights reserved. Dependency allowlist: approval-required (D10). Jira: off. Notifications: in-session only. Execution mode preference: **checkpoint** (you confirm by writing `.chuck/mode` at Gate 1).

**Why:** Operator-selected at intake 2026-07-06; recorded in SCOPE.md §Intake settlements.

**Alternatives rejected:** As offered at intake; none carried hidden trade-offs worth restating.

VETO POINT: no

## D14 — The M2 mural gate measures presence; the operator attests realness

**Decision:** The machine gate for "all 14 murals show real names" is: (a) all 14 `mural-data.ts` entries carry a non-empty `description` (the Architecture §4.4 un-suppression signal — 0/14 today by design), and (b) all 14 names appear in the deployed `/murals/trail` HTML. Whether the content is _Rachel's real content_ (vs plausible fiction) is attested by you in HT2's result form — a machine cannot judge truth, and Invariant 4 forbids pretending it can.

**Why:** Gate-authoring discipline: deterministic probe for what a machine can check, review/attestation for what it cannot. Description-presence is the only field that flips 0→14 at ingest, making it a clean signal.

**Alternatives rejected:** (a) Gating on `name` changes — names are non-empty today (real business locations), so no deterministic before/after signal exists; (b) a placeholder-wordlist scan — fabricated content doesn't announce itself with the word "placeholder".

VETO POINT: yes

---

## Amendments

After Gate 1, the approved plan does not change by drive-by edits. The gate hook blocks direct writes to `DECISIONS.md`, `BUILD-SPEC.md`, and `byrachelpierce-web_Architecture_v1.md` once `.chuck/plan-approved` exists. The one sanctioned path for a mid-run change is `/chuck:change`: it captures a change-request, produces a delta plan and delta budget, pauses for your mini-veto, and only then appends the settled change here as a new `## D<n>` entry continuing the sequence. Never rewrite or delete an earlier entry.

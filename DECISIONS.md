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

## D15 — Plan-refutation resolutions (2026-07-07)

**Decision:** A fresh Snorklewacker (no planning context, charged to REFUTE) attacked the committed package and returned 13 findings plus one UNVERIFIED suspicion. Every finding was resolved — fixed in the package or recorded here. The dispositions, numbered as the refuter numbered them:

- **R1 (severe):** The F8 `db:push` disarm and the F6/F7 backup/restore closure had no falsifiable gates — closure was asserted, not proved. **Fixed:** new M0 gates `push-guard` (probe runs `db:push:dev` against a `libsql://` URL and demands non-zero exit + the literal `DB PUSH REFUSED`; also fails if the unguarded `db:push` script still exists) and `restore-roundtrip` (`tests/backup-restore.roundtrip.test.ts`, backup→restore→count-equality on local `file:` DBs; vitest exits 1 today on the missing file — executed).
- **R2 (severe):** `backup-check.mjs` verified only the backup's DATE — a 0-byte file passed. **Fixed:** the probe now requires one parseable JSON-array dump per app table for the covering date and paintings at exactly 528 rows (the same constant `prod-verify.mjs` asserts). Executed both ways: fixture with 528 rows → `BACKUP OK`; empty paintings dump → `BACKUP FAIL … 0 rows (expected 528)`. The backup file shape (`backups/<table>-<YYYY-MM-DD>.json`) is now pinned in BUILD-SPEC M0 item 2, Architecture §6, and HT2.
- **R3:** BUILD-SPEC called L7/L8 "pending" while the audit records both VERIFIED. **Fixed:** M0 item 7 and the DoD now say "re-prove at milestone close", not "pending".
- **R4:** The security narrative ("leaked values remain in git history; the sweep allowlists them") was contradicted by execution: an all-branch scan found ZERO secret-shaped strings — the leak predates this repo and the allowlist was dead code. **Fixed:** narrative corrected in Architecture §8, OPERATOR-GUIDE 0.1, and Invariant 3; the inert allowlist REMOVED from `secret-sweep.mjs` (the sweep is now absolute). Re-executed after removal: `history lines scanned: 60347` / `SWEEP CLEAN`. Rotation stays owed — the exposure was real, just not in-repo.
- **R5:** BUILD-SPEC M1 assigned fallback work to "Rosebud", who is absent from D9's roster. **Fixed in wording:** Rosebud is Chuck's standing-crew researcher (present in every run, like Oliver/Bill/Hodge-Podge); D9 lists only the Anxiety-Closet _specialists_. The M1 text now says so explicitly. D9 itself is unchanged — it was never a complete cast list.
- **R6:** "All 528 painting pages" in the sitemap was never measured by any gate (the seeded build proves ~20, e2e proved ≥1). **Fixed:** new M3 gate `sitemap-prod` (`sitemap-count.mjs`: fetches the live `/sitemap.xml`, asserts exactly 528 distinct `/collection/painting/` URLs); M1's e2e assertion tightened to "exactly the 20 fixture painting URLs".
- **R7:** The M2 deployed assertion checked mural _names_ only — a regression shipping titles but suppressing descriptions would pass; and the `local` lane label on a network probe read as mislabeled. **Fixed:** `mural-content.ts` now also asserts all 14 _descriptions_ appear in the deployed HTML (normalized against HTML entity escaping) — this supersedes D14(b)'s names-only deployed check (D14's principle stands: machines prove presence/deployment, the operator attests realness). Lane semantics defined in BUILD-SPEC Testing strategy: `lane` names where the command executes; the schema offers only `local`/`ci`/`on-target`, so network probes are `local`-lane. Executed: probe returns `14/14 names, 0/14 descriptions … MURAL GATE FAIL` today — correct pre-content behavior.
- **R8:** Probes were described as "deterministic" while the plan's own risk register documents a 40-minute network outage breaking them. **Fixed:** now described as "deployed-state production probes (network-dependent)"; a persistent outage is a `blocked-gate` escalation, never a silent skip.
- **R9:** HT2's "non-trivially sized" was unquantified. **Fixed:** HT2 step 3 now states the bar (per-table JSON arrays, paintings = 528 rows, probe-enforced).
- **R10:** The F15 fix cited "Architecture §5.2.3", which does not exist. **Fixed:** now cites `docs/SITE-ARCHITECTURE-v2.md` §5.2 list item 3 (line 171), both occurrences. (The audit file's original citation stays as written — it is a historical record.)
- **R11:** BUILD-SPEC pinned Node 20.x while the gate machine runs Node 24.4.0, unpinned — a "green locally / red in CI" divergence risk (and real: a libuv teardown crash on Node 24 was hit while testing `mural-content.ts` and worked around with `process.exitCode`). **Resolved as policy, not a fix:** CI (Node 20) is the authoritative lane on version-sensitive divergence; M0 adds an advisory `engines: { "node": ">=20 <25" }`. Installing Node 20 locally is your call — overrule here if you want the stronger pin.
- **R12:** F17's Wix-inventory ownership was muddled across three documents (M0 DoD vs M1 input vs audit). **Fixed:** stated once — F17 is an M1 input the operator supplies at the M0 checkpoint; removed from M0's DoD.
- **R13:** The Lighthouse gates were `exit0` against an unwritten LHCI config — a config that collects without asserting exits 0 regardless of score, silently de-gating the budgets. **Fixed:** BUILD-SPEC M1 item 5 pins `lighthouserc.json` with error-level assertions (performance 0.85 / accessibility 0.95 / SEO 0.95) and the audited painting page (`/collection/painting/matthews-turtle`); new gate `lighthouse-config` (M1 + M3) fails unless the committed config actually asserts those minima. Executed today: `LHCI CONFIG FAIL: cannot read lighthouserc.json` — correctly red until M1 writes it.
- **UNVERIFIED (recorded, not resolved by fiat):** legacy `CLAUDE.md` routes test suites to a Haiku `test-runner`, while Chuck's routing doctrine denies Haiku dispatches. Within `/chuck:run`, Chuck's doctrine governs (suites run by Bill or gate commands; any test-runner delegation goes to `sonnet`, not Haiku). Non-Chuck sessions keep CLAUDE.md as written. If you want CLAUDE.md itself reconciled, say so at Gate 1 — agents won't edit your standing orders unprompted.

**Why:** Refutation protocol — every finding is fixed in the package or surfaced here with rationale; nothing is waved off. The four the refuter would not have let past Gate 1 (R1, R2, R4, R6) are all machine-gated now.

**Alternatives rejected:** Treating narrative findings (R3/R4/R8) as cosmetic — in a project whose thesis is "verify, don't trust the record", a record that contradicts execution is precisely the defect class this run exists to kill.

VETO POINT: yes

## D16 — Admin panel: in-run, pre-cutover, full CRUD, magic-link + admin flag, soft-delete (scope added at Gate 1 intake, 2026-07-07)

**Decision:** A new milestone **M3 — Admin panel** ships non-developer CRUD over the painting collection BEFORE cutover; go-live renumbers to **M4** (references to "M3" in D1–D15 mean the go-live milestone, now M4). Operator-settled at intake 2026-07-07: (a) timing — in this run, pre-cutover, so the ops manager can edit and QC the site through it before DNS moves; (b) scope — field/tag edits, archive/restore, AND create with upload of pre-processed images (the Photoshop pipeline produces web/thumb JPEGs that already fit the existing requirements; the panel uploads them and collects the full edit field set — the form's "Description" writes the existing `notes` column, no `description` column exists or is added — plus tags and dimensions-in-inches); (c) admins — Matthew, Rachel, Laciey (byRachelPierce.com addresses) via the EXISTING magic-link flow plus an additive `users.is_admin` flag; admin management is CLI-only (`scripts/set-admin.ts`, operator-run), no admin-management UI; (d) deletes are soft (additive `paintings.archived_at`; archive/restore; no hard delete from the panel). Full behavior contract: Architecture v1 §11 — routes, `requireAdmin()` 404 posture, slug immutability, upload conventions (`<slug>-<hash8>.jpg`, 600 KB/200 KB caps), JPEG SOF px parsing (no new dependency), revalidation set, e2e session seam.

**Ordering call within the decision:** M3 runs AFTER M2 (content loop) because the CSV ingest ritual assumes a single writer to `paintings` — the CSV era ends before the panel becomes a second writer, killing the lost-update/diverging-dry-run window. Cost: if Rachel's content drags, panel work waits behind it. The M2 escalation path names the mitigation: the operator may reorder M2↔M3 via `/chuck:change`, accepting that the panel must not open to admins until `--apply` has run.

**Why:** Operator direction (the feature "does not exist" was correct — nothing in R0–R5 or the legacy spec provides any in-app write surface); the intake answers above are the operator's own; the design maximizes reuse (Auth.js flow, Blob conventions, existing honesty rules) and adds zero dependencies.

**Alternatives rejected:** (a) Post-launch release — operator explicitly overruled (QC must happen through the panel pre-cutover); (b) separate admin credential system — new attack surface the architecture deliberately avoids; (c) hard delete — irreversible against live data where mis-clicks live; (d) slug editing in the panel — permalink/SEO breakage with no redirect story this release; (e) panel-before-content ordering — concurrent-writer risk on the ingest ritual (recorded above with its escape hatch).

VETO POINT: yes

## D17 — Invariant-1 amendment + the count contract after the panel exists

**Decision:** Two consequences of D16, settled now so no gate quietly rots: (1) **Invariant 1 amended** — production writes now have two sanctioned channels: the operator ritual (schema, bulk, admin-flag flips) and, from M3 on, row-level painting/tag mutations through the authenticated admin panel (admin DB-sessions only, soft-delete only). Destructive/raw SQL, hard deletes, and schema changes remain ritual-only; agents still never write production. (2) **The collection count stops being a constant** once the panel is live. Every 528-asserting gate runs pre-panel and stays valid (M0 `prod-verify`, M2 `backup-check` — both run before M3 starts); from M4 on, count gates compare two live sources: the new `sitemap-vs-db` probe (live sitemap painting URLs === production non-archived count) **replaces** `sitemap-count.mjs` (written for refutation R6 earlier today, superseded before ever gating — deleted, not orphaned). `admin-lockout` re-runs at M4 against the real domain.

**Why:** The refutation standard (D15): a gate that asserts a stale constant after the world can legally change is a gate that fails honest operators or passes dishonest states. Comparing sitemap to live DB is strictly stronger than comparing to 528 — it also catches archived-but-still-in-sitemap leaks, which is the exact regression the archived-exclusion sweep must prevent.

**Alternatives rejected:** (a) Keeping 528 with a "update the constant when it changes" comment — a manual step on a machine gate is a future lie; (b) freezing the collection until after go-live — defeats the operator's stated purpose (pre-cutover QC edits).

VETO POINT: yes

---

## Amendments

After Gate 1, the approved plan does not change by drive-by edits. The gate hook blocks direct writes to `DECISIONS.md`, `BUILD-SPEC.md`, and `byrachelpierce-web_Architecture_v1.md` once `.chuck/plan-approved` exists. The one sanctioned path for a mid-run change is `/chuck:change`: it captures a change-request, produces a delta plan and delta budget, pauses for your mini-veto, and only then appends the settled change here as a new `## D<n>` entry continuing the sequence. Never rewrite or delete an earlier entry.

---

## D18 — Amendment A1: secret-rotation COMPLETED by the operator; `rotation-recorded` gate retired (2026-07-14)

Continues the sequence per the `## Amendments` rule (the sanctioned mid-run change path). This supersedes the premise of change-request `CR1`, which had proposed WAIVING rotation; the operator instead COMPLETED it, so this amendment records completion — not a waiver — and carries no standing-exposure risk statement.

**What changed and why.** On 2026-07-14 the operator rotated both leaked credentials (legacy DECISIONS 003/013): a new Resend API key and a new Turso production database auth token were created and the prior ones invalidated; `Database Token.txt` was deleted; the `public/art/` backup (Phase 0.6) is confirmed. This satisfies the security purpose of HT1 (see D11). Because the human-hands result form is only 4/7 operator-observed (the magic-link send-test and the Vercel-preview confirmation were not performed in-session), the form-based `rotation-recorded` gate cannot pass on honest data and is retired in favour of the operator's direct confirmation, recorded here and in `ESCALATIONS.md` E2.

**Delta applied.**

1. `.chuck/gates.json` M0: the `rotation-recorded` gate object is removed. M0 now has 12 machine gates; all remain machine-runnable as written.
2. `BUILD-SPEC.md` M0 (frozen text amended by reference — not edited in place): work item 9 (HT1) is retired as an obligation; the escalation trigger "HT1 not returned → human-hands" no longer applies; the DoD clause "secrets are rotated (HT1 all-Pass)" is superseded by — "the leaked Resend key and Turso production token are rotated (operator-confirmed 2026-07-14, Amendment A1); magic-link delivery is verified in M3 once the dedicated Resend account + key exists."
3. `BUILD-SPEC.md` M3 item 7 (by reference): unchanged in force — still requires creating the NEW dedicated ByRachelPierce Resend account + API key (magic-link auth is non-functional until it lands), then the SPF/DKIM domain verification in that account.
4. `BUILD-SPEC.md` M4 (by reference): item 2 env-checklist wording "M0-rotated secrets" → "the current rotated secrets (Resend key from the M3 account; Turso token rotated 2026-07-14)"; item 6 (Milo / ship report) carries the Phase-0.7 Vercel-preview confirmation and the magic-link live-delivery confirmation as explicit ship-report checklist lines.

**Not affected.** M1, M2. No past-green milestone is reopened. Budget: null delta — no band change (CR1's Otis-discipline statement stands).

**Open riders (unchanged, non-blocking).** RIDER 1 (stale remote-branch deletions) and RIDER 2 (F15 `Lilly`→`Lily` in `docs/SITE-ARCHITECTURE-v2.md` line 171) remain for the operator, carried to the next touchpoint.

---

## D19 — M0 gate NSR dispositions: build-tooling license acceptance (F-BINK-5) and `.prettierignore` note (F-BINK-7) (2026-07-14)

Records the operator's dispositions of two NEEDS-SENIOR-REVIEW / NIT findings from Binkley's M0 gate (report `.chuck/reports/M0/milestone-report.md`). Continues the sequence per the `## Amendments` rule.

**F-BINK-5 — build-tooling licenses accepted (operator-approved 2026-07-14).** `lightningcss` / `lightningcss-win32-x64-msvc` 1.31.1 (MPL-2.0, pulled via `tailwindcss`) and `caniuse-lite` (CC-BY-4.0, pulled via `next`) appear in the `npm ls --omit=dev` tree, outside D10's allowlist (MIT / Apache-2.0 / BSD / ISC). Both are build-time-only tooling with zero app-source references and are never bundled into the running site (MPL is file-level copyleft on the tool's own files; CC-BY is data attribution). Clarification of D10: the allowlist governs runtime-BUNDLED dependencies (code shipped in the deployed app), not build/tooling transitive dependencies. These two are accepted on that basis. If a future dependency introduces a non-permissive license into the runtime bundle, D10 still applies in full.

**F-BINK-7 — `.prettierignore` recorded.** The `.prettierignore` added during M0 (excludes generated/vendored files from Prettier) was not itemized in a BUILD-SPEC work item or a DECISIONS entry (rule-10 ambiguity-protocol miss). Its contents are benign and standard; it is recorded here retroactively. No behavior change.

---

## D20 — Amendment: Turso token — operator waiver of F-BINK-1; correction of A1's rotation claim (2026-07-14)

Continues the sequence per the `## Amendments` rule. Corrects Amendment A1 (D18) on one point and records the operator's disposition of gate finding F-BINK-1 (report `.chuck/reports/M0/milestone-report.md`; ESCALATIONS E3).

A1 recorded the Turso production token as rotated 2026-07-14 with "no standing exposure." Binkley's executed evidence (F-BINK-1) showed the token in `.env.local` is a JWT issued 2026-03-01, unchanged since 2026-07-04, still authenticating against live production — so the rotation is NOT independently verifiable and the "no standing exposure" framing was UNVERIFIED.

**Operator decision (2026-07-14, explicit).** Accept the current Turso token as-is; waive further rotation/verification; do not re-raise. Basis: the credential was never in the public GitHub repo (secret-sweep CLEAN across full history); known exposure is local-machine files and retained AI-conversation history only, not any indexed/public location.

**Effect.** F-BINK-1 is closed by operator waiver (not by a fix). The M0 DoD "secrets rotated" clause is satisfied for the Turso token by this waiver; the token continues in use as-is. The Resend key replacement remains an M3 functional prerequisite (magic-link auth). No code change. This supersedes A1 only on the Turso rotation/exposure characterization; A1's gate/spec deltas (retired `rotation-recorded`, etc.) stand.

---

## D21 — E4 resolution: cycle-4 authorized for the db:push guard `.env`-layering fix (F-RG-3); F-RG-4 accepted (2026-07-14)

Records the operator's resolution of escalation **E4** (gate-3-strikes). The operator authorized ONE more scoped cycle (cycle 4) past the §7 three-strike line for this specific bounded fix.

**F-RG-3 (HIGH) — to be fixed (cycle 4).** The `db:push` guard reads only `.env.local`, but `drizzle-kit push` also auto-loads a sibling plain `.env` (before `.env.local`, `override=false`), so a remote URL placed in `.env` would target production while the guard says ALLOW (reproduced hermetically, cycle-3 report `.chuck/reports/M0/snorklewacker-regate2.md`). Fix: the guard replicates drizzle-kit's full env resolution (load `.env` then `.env.local` with drizzle-kit's precedence) so its resolved URL matches drizzle-kit's actual target in the `.env`-present case; tests cover the layering shapes; the `push-guard.mjs` gate probe is extended to exercise the `.env`-layering axis so the gate itself catches this class.

**F-RG-4 (MEDIUM) — ACCEPTED as an inherent limitation.** A raw `npx drizzle-kit push` (bypassing the npm wrapper scripts) is not interceptable by a wrapper guard. The guard's remit is the sanctioned `npm run db:push*` path (D7 disarms those); running the raw binary against production is an out-of-band operator action outside M0's guard scope. Documented, not gated.

---

## D22 — E5 resolution: F-RG-5 accepted as a low-risk latent gap; M0 passes with accepted residual (2026-07-15)

Records the operator's resolution of escalation **E5** (fourth-cycle gate). The operator elected to ACCEPT F-RG-5 rather than authorize a fifth remediation cycle.

**F-RG-5 (HIGH-in-class, accepted).** On win32 (the sole sanctioned dev OS) `process.env` keys are case-insensitive, but the db:push guard's `definesUrl` (`scripts/db-push-dev.ts`) checks the key case-sensitively — so a case-variant `.env` key (e.g. `turso_database_url=<remote>`) could resolve to `file:` in the guard (ALLOW) while real `drizzle-kit push` targets the remote (cycle-4 report `.chuck/reports/M0/snorklewacker-regate3.md`, ledger RG4-8). Reachability is identical to the already-dispositioned F-RG-3/F-RG-4 class: no `.env` on disk (only `.env.local`), `.env*` gitignored, and it requires a developer to hand-create a local `.env` with a case-variant remote key — not exploitable as the repo stands.

**Decision.** Accepted as a low-risk latent gap. The guard is materially hardened over four cycles (all `.env.local` bypass shapes, the `.env`-layering axis with the complete drizzle-kit env-file set `{.env, .env.local}`, empty-value and duplicate-key edges — closed and gate-probed). M0 passes with this accepted residual.

**Follow-up work item (deferred, non-blocking).** Harden the guard to a FAIL-CLOSED posture: REFUSE the push unless it can positively prove the effective target is a local `file:` DB, resolving `TURSO_DATABASE_URL` case-insensitively across both `.env` and `.env.local` (mirroring win32 `process.env`), and extend `push-guard.mjs` with lowercase/mixed-case cases. Carried as a hardening item for a later maintenance pass; it does not block M0.

---

## D23 — M1 Lighthouse resolves Chrome via the committed Playwright chromium (2026-07-15)

Continues the sequence per the `## Amendments` rule. Records the mechanism by which the M1 `lighthouse` gate obtains a Chrome binary.

M1 Lighthouse resolves Chrome via the committed Playwright chromium because no standalone Chrome is installed on the sole sanctioned dev machine (Windows) — only Microsoft Edge, which `lhci autorun` will not accept, failing "Chrome installation not found." A `scripts/run-lighthouse.mjs` wrapper sets `process.env.CHROME_PATH` from `require('playwright').chromium.executablePath()` (falling back to an ambient `CHROME_PATH` if one is already set, e.g. a CI runner with real Chrome), then invokes `lhci autorun`, forwarding any collect overrides (the `lighthouse:prod` variant's `--collect.*` args). The `lighthouse` and `lighthouse:prod` npm scripts are repointed through the wrapper. This keeps the local `lighthouse` gate hands-free (`bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run lighthouse"` needs no ambient `CHROME_PATH`); `lighthouserc.json` stays a JSON file with its error-level budgets (perf 0.85 / a11y 0.95 / seo 0.95) intact and still passes `.chuck/probes/lighthouse-config-check.mjs`. No new dependency: `playwright` is already present (pulled by `@playwright/test`).

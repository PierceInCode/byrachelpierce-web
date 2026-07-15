# Escalations — byrachelpierce-web takeover

**Escalations are the ONLY mid-run operator interruptions.** Between Gate 1 (plan veto) and Gate 2 (ship), Chuck runs autonomously; nothing else pulls you back in except a checkpoint pause you chose. When an escalation fires, the run stops cleanly and no further work begins until your answer is recorded in the entry's `**Answer:**` line; answering is how you resume (`/chuck:run`).

Entry types (exactly one per entry): `core-bet-failure` | `gate-3-strikes` | `irreversible-op` | `budget-overrun` | `human-hands` | `spec-amendment`.

Likely candidates this run, so none surprises you: `human-hands` (HT1 rotation, HT2 content loop with Rachel, HT4 admin QC with Laciey, HT3 cutover smoke), `irreversible-op` (anything touching production data, including the M3 migration ritual), and `blocked-gate`-style `gate-3-strikes` if Lighthouse budgets or the M3 auth seam resist remediation.

_The log below is empty by design; the run appends entries at the moment of escalation._

---

## E1 — budget-overrun — 2026-07-07 — planning phase

**Type:** `budget-overrun`

**What happened:** Otis's deterministic count (`bin/usage.sh`, 9 transcript files, verbatim: `usage: input=367069 output=865784 cache_read=69454934 cache_create=5008396 total=1232853 files=9 lines=1822 malformed=0`) puts the plan-refutation sessions of 2026-07-07 at 1,232,853 in/out tokens. Cumulative planning-phase actuals are **1,730,577** against the planning band of 0.3M–0.8M — ≈116% over the high end, past the `threshold: 50%` line in BUDGET.md. The threshold trigger fires regardless of run mode.

**Why it happened (context, not excuse):** planning was estimated as one session; it became three — the original package authoring, a reboot-killed refutation dispatch, and today's full re-dispatch (a fresh max-effort Snorklewacker over the whole package plus 13-finding remediation and re-validation). The refutation content was not wasted — it produced D15 and four new gates — but the band did not price a redo.

**Decision needed (pick one, or write your own):**

- (a) **Accept as sunk** — planning spend is done and cannot be un-spent; keep the M0–M3 bands as written (they priced milestone work, not planning, and are unaffected by this overrun). Otis re-baselines at each checkpoint as normal. _(Recommended: the overrun is confined to the planning phase; no forward band is invalidated by it.)_
- (b) Accept AND widen the M0–M3 bands by a stated factor if you now distrust the estimating.
- (c) Cut scope before approving the plan.

**Answer:**
Accept and widen bands to allow for 200% overage.
---

## E2 — human-hands — 2026-07-07 — M0 secret rotation (HT1)

**Type:** `human-hands`

**What happened:** M0's machine work is COMPLETE on chuck/M0 @ 102a0b9. Gates already executed green this session (quote): check/coverage/build-seeded/e2e green via Bill (coverage 90.36% lines / 97.67% funcs; build 34/34; e2e 12 passed); dep-audit exit 0 AFTER drizzle-orm 0.45.2 CVE bump (was red: GHSA-gpj5-g38j-94v9 HIGH); eol-clean "EOL OK"; push-guard "PUSH-GUARD OK"; restore-roundtrip 3/3; prod-verify "PROD-VERIFY OK" (528 paintings, 0 sentinels, 4 migrations); alias-smoke "SMOKE OK" (4/4 routes 200); tag-r4 (R4 @ 2c9f15e pushed). Pending: ci-green on 102a0b9 (running, PR #13 draft), rotation-recorded (THIS escalation), then Binkley's full gate.

The operator action: run protocol `.chuck/human-tests/HT1-secret-rotation.md` (rotate the leaked Resend key + Turso token, update .env.local, confirm dev + magic-link, delete Database Token.txt if present, confirm art backup 0.6 + Vercel previews 0.7), save the filled form at `.chuck/human-tests/HT1-result.md`, resume with /chuck:run. Rotation is contractually not deferrable again (D11).

RIDER 1 (operator approval requested in your Answer): remote-branch deletion list per audit §2/F11 — merged-and-stale: r3-collection, r4-content, docs/r3-close-out, docs/r4-close-out, final-product-planning; closed-unmerged: vercel/react-server-components-cve-vu-y3bp7s. Approve deletion (all/some/none) in the Answer; deletion happens after your answer.

RIDER 2 (operator one-liner, F15): in docs/SITE-ARCHITECTURE-v2.md §5.2 list item 3 (line 171), fix Lilly->Lily (both occurrences on the line) — agents cannot edit docs/.

Answer format suggestion: "HT1 returned at <path>; branches: <decision>; F15: done/deferred".

**Operator note (2026-07-07, recorded after the stop):** the leaked Resend key (`re_cQuXwBZ1…`) has already been DELETED — the kill half of HT1 step 1 is done. The plan forward, per the operator: **create a brand-new Resend account dedicated to ByRachelPierce**, then create a new API key under it. HT1 step 1 therefore reads "create the dedicated account + new key" instead of "revoke + recreate", and step 4 (magic-link send test) only works once the new key is in `.env.local`'s active lines. Downstream consequences, so no milestone trips on them: (a) the M3 Resend **domain verification** (SPF/DKIM for byrachelpierce.com) must be performed in the NEW account; (b) the M4 env checklist's Resend key comes from the new account; (c) until the new key lands, magic-link email is broken in dev and previews — automated tests are unaffected (`resend` is mocked, key absent in CI), but any manual trail check will fail to send. Free-tier limits (100/day) assumed unchanged unless the new account differs.

**Operator note — ADDENDUM (2026-07-07, for next session): Resend ↔ Wix blocker + interim-key strategy.** New constraint from the operator: **the dedicated byrachelpierce.com Resend account cannot be created until AFTER the site is migrated off Wix — Resend and Wix are incompatible** (both want to own the domain's DNS/DKIM records, so byrachelpierce.com domain verification in Resend cannot happen while Wix still holds the domain). This means the "new dedicated account" from the note above is gated on the Wix→Vercel domain cutover (M4), NOT available now.

**Proposed plan (needs a decision next session — a working item to resolve tomorrow):** stand up an **interim Resend account on a non-byrachelpierce.com domain** (or Resend's own onboarding/test sending domain) with **its own API key**, and wire all magic-link code against the real Resend API using that key. The design goal: **at go-live, the ONLY change is swapping the API key** (and the from-address/verified domain) — no code changes, because everything will already have been exercised against the live Resend API through the interim key. Open questions to settle: (1) does the interim account use Resend's shared onboarding domain (delivers to the account owner's own address only) or a spare domain we already control that is NOT on Wix?; (2) confirm the from-address is env-driven so the go-live swap is key + `RESEND_FROM` only; (3) sequence — interim key now for M3 dev/QC, real dedicated account + byrachelpierce.com verification created during the M4 Wix cutover, key swapped as the last go-live step.

**Answer (recorded 2026-07-14 from the operator's in-session confirmation):** DONE — not waived. The operator rotated BOTH leaked credentials: a new Resend API key and a new Turso production database auth token were created and the old ones invalidated; `Database Token.txt` was deleted; the `public/art/` backup (Phase 0.6) is confirmed. The security purpose of HT1 is met and there is no standing production-DB exposure (the Turso token is rotated). Two HT1 items are NOT confirmed and are carried forward, not gated here: the magic-link send test (step 4) — deferred to M3, which stands up the dedicated ByRachelPierce Resend account + key (magic-link auth stays unverified until then); and the Vercel preview confirmation (step 7 / Phase 0.7) — carried to Milo's ship-report checklist at Gate 2. Because only 4 of 7 form rows are operator-observed, the `rotation-recorded` machine gate is RETIRED and superseded by this direct operator confirmation via **Amendment A1 (DECISIONS D18)**; M0's remaining 12 gates stand. RIDER 1 (stale remote-branch deletions) and RIDER 2 (F15 `Lilly`→`Lily` docs one-liner) are NOT resolved by this answer — they remain open as non-blocking items carried to the next operator touchpoint.

---

## E3 — human-hands — 2026-07-14 — M0 gate: Turso token rotation not verifiable (F-BINK-1)

**Type:** `human-hands`

**What happened:** Binkley's M0 gate (fresh context, HEAD `acd4bbd`) rendered FAIL. All 12 machine gates passed, but finding **F-BINK-1** (IMPORTANT / NEEDS-SENIOR-REVIEW) contradicts Amendment A1's claim that the Turso production token was rotated 2026-07-14. Executed evidence (report `.chuck/reports/M0/milestone-report.md`, probes SC1/SC4): the production `TURSO_AUTH_TOKEN` currently in `.env.local` is an EdDSA JWT with `iat = 2026-03-01` (issued in March, not July); `.env.local` has not been rewritten since 2026-07-04; and that same token STILL authenticates against live production right now (`prod-verify.mjs` → PROD-VERIFY OK, run repeatedly). A token issued in March cannot be a token created on 2026-07-14. Two readings, both bad: (a) a new token was created in the Turso dashboard but `.env.local` was never updated, so the pre-rotation token is still the one in use — and if it is the leaked-lineage credential, the leak is NOT closed; or (b) no Turso rotation actually happened. The distinguishing artifact (Turso token-audit log) is outside session reach (no Turso cloud CLI). Consequence: the M0 DoD "secrets rotated" clause and Invariant 3 are NOT verifiably satisfied, and A1's "no standing production-DB exposure" framing is UNVERIFIED — possibly false. The three code findings from the same gate (F-BINK-2/3/4) are being remediated by Oliver in parallel and do not need you.

**Operator action needed:**

1. In the Turso dashboard for the `byrachelpierce` database, confirm whether the auth token now in `.env.local`'s production block is the NEW token you created on 2026-07-14, or an older one.
2. Ensure the OLD / leaked-lineage Turso token is actually REVOKED at Turso — creating a new token does not revoke old ones, and Binkley proved the token in `.env.local` still authenticates.
3. If `.env.local` still holds the old token, replace it with the new post-rotation token (do NOT commit `.env.local`).

Then resume with `/chuck:run`: I re-probe (decode the new JWT's `iat`, confirm the old token no longer authenticates) and either confirm A1 or correct it.

**Answer (recorded 2026-07-14, operator's explicit in-session instruction):** WAIVED. The operator accepts the current Turso production token as-is and directs that this not be raised again. Basis (makes the decision reasonable): the credential was never in the public GitHub repository (secret-sweep CLEAN across full history); known exposure is local-machine files and retained AI-conversation history only, not any indexed/public location. F-BINK-1 is closed by operator waiver — no rotation verification is performed. A1's "Turso rotated 2026-07-14 / no standing exposure" framing is corrected by **DECISIONS D20** to "accepted as-is, unverified, residual risk waived by operator." The M0 DoD secrets-rotated clause is satisfied for Turso by this waiver; the Resend replacement remains an M3 functional prerequisite for magic-link auth.

---

## E4 — gate-3-strikes — 2026-07-14 — M0 db:push guard: `.env`-layering gap (F-RG-3)

**Type:** `gate-3-strikes`

**What happened:** M0's Anxiety-Closet gate returned FAIL three cycles running, all on the `db:push` production-write guard, so the 3-strike line stops the run for your decision. Nuance that matters: this is NOT one defect grinding — each cycle's finding was genuinely fixed and adversarial review surfaced an adjacent one.

- **Cycle 1** (`acd4bbd`): guard bypassable on a duplicate-key `.env.local` (first-match vs dotenv last-match) → FIXED.
- **Cycle 2** (`de0c8ba`): still bypassable via export-prefix / inline-comment / whitespace+quote shapes → FIXED at the root by resolving through `dotenv.parse` itself (0 bypasses across 12 shapes, independently verified).
- **Cycle 3** (`dbc8638`): NEW adjacent vector — **F-RG-3 (HIGH)**: real `drizzle-kit push` also auto-loads a sibling plain `.env` (before `.env.local`, `override=false`); the guard reads only `.env.local`, so a remote URL placed in `.env` would win while the guard says ALLOW. Reproduced hermetically. NOT currently exploitable (no `.env` file exists; it is gitignored), but it is the same loaded-gun class the guard exists to disarm. Plus **F-RG-4 (MEDIUM)**: a raw `npx drizzle-kit push` (bypassing the npm wrapper) is inherently unguarded.

All 12 deterministic gates PASS on `dbc8638`; the other two cycle-1 findings (restore SQL-injection, silent missing-dump) are fixed and regression-clean; F-BINK-1 is waived by you (E3 / D20). Cycle-3 reports: `.chuck/reports/M0/milestone-report-regate2.md`, `snorklewacker-regate2.md`.

**Decision needed (pick one):**

- (a) **Authorize one more scoped cycle** (RECOMMENDED): fix F-RG-3 by making the guard replicate drizzle-kit's full env resolution (load `.env` then `.env.local` with the same precedence), and document F-RG-4 as an accepted inherent limitation of a wrapper guard (raw `drizzle-kit` is out of scope; D7 already disarms the npm push scripts). Small, bounded fix; closes the HIGH gap; then re-gate and close M0.
- (b) **Accept F-RG-3 and F-RG-4 as low-risk latent gaps and pass M0 now**: the guard is materially hardened (all `.env.local` bypasses closed), the gap is dev-workflow-only and not currently exploitable (no `.env` present, gitignored). I record the acceptance in DECISIONS with a follow-up note, write the gate artifact, and close M0.
- (c) Something else / hand off.

**Answer (recorded 2026-07-14, operator decision):** Option (a) — AUTHORIZED. Proceed with one more scoped cycle (cycle 4): fix F-RG-3 by making the guard replicate drizzle-kit's full env resolution (load `.env` then `.env.local` with drizzle-kit's precedence/override semantics), with tests for the `.env`-layering shapes and the push-guard gate probe extended to exercise that axis; accept F-RG-4 (raw `npx drizzle-kit push`) as an inherent wrapper limitation, documented in DECISIONS D21. Then re-gate and close M0. This cycle-4 authorization is an explicit operator extension past the §7 three-strike line for this specific bounded fix.

---

## E5 — gate-fourth-cycle — 2026-07-14 — M0 db:push guard: case-variant .env key prod-write bypass (F-RG-5)

**Type:** `gate-fourth-cycle` (past the section-7 three-strike line, which was already extended once by D21/E4).

**What happened:** The operator-authorized scoped cycle 4 (D21) fixed the F-RG-3 uppercase `.env`-layering gap — verified: the guard now matches real drizzle-kit byte-for-byte across 11 `.env`/`.env.local` combinations (incl. empty-value), the complete auto-load set is confirmed to be exactly `{.env, .env.local}` (no extra env file, no dotenv-expand), and the gate probe mutation-catches the class. All 12 deterministic gates PASS on `dede7b6`; CI green on that exact commit.

BUT the cycle's central charter — CLOSE THE CLASS — is not met. A fresh Snorklewacker refutation, independently reproduced by Binkley (ledger RG4-8), found a **live prod-write bypass of the SAME class on a new axis**: a case-variant `.env` key.

- **F-RG-5 (HIGH, Iron Rule 1):** `db-push-dev.ts:33` `definesUrl` decides `.env` precedence with a CASE-SENSITIVE `hasOwnProperty('TURSO_DATABASE_URL')`, but `drizzle.config.ts:53` reads `process.env.TURSO_DATABASE_URL`, which on **win32 is CASE-INSENSITIVE**. So a sibling `.env` with `turso_database_url=<remote>` (or `Turso_Database_Url=`, `export turso_database_url=`) + `.env.local=file:` makes the guard resolve `file:` → ALLOW and exec `drizzle-kit push`, while real drizzle-kit targets the REMOTE. Reproduced by two independent hermetic real-drizzle-kit executions. Windows is the SOLE sanctioned dev environment (CLAUDE.md), so the bypass exists exactly where the project runs.
- Reachability class is identical to F-RG-3: no `.env` on disk (only `.env.local`), `.env*` gitignored (cannot be committed/bad-merged from tracked files); requires a developer to manually create a local `.env` with a case-variant remote key. Not exploitable as the repo stands today.
- The gate suite does NOT catch it: `push-guard.mjs` check (5) uses only uppercase `.env` keys — the gate shares the guard's blind spot, the same structural-blindness pattern that failed cycles 2 and 3.

Cycle-4 reports: `.chuck/reports/M0/milestone-report-regate3.md`, `.chuck/reports/M0/snorklewacker-regate3.md`. Ledger: `.chuck/probes/M0-ledger.md` (RE-GATE CYCLE 4).

**Decision needed (pick one):**

- (a) **Authorize one more scoped cycle (cycle 5)** to close F-RG-5: normalize `TURSO_DATABASE_URL` key resolution case-insensitively in `definesUrl` / `resolveEffectiveUrl` / `resolveLayeredUrl` (mirroring win32 `process.env`), extend `push-guard.mjs` check (5) with lowercase/mixed-case `.env`-key cases, add unit tests. Bounded change: `db-push-dev.ts` + `push-guard.mjs` + tests. Then re-gate and close M0.
- (b) **Accept F-RG-5 as a low-risk latent gap and pass M0 now.** The guard is materially hardened (all `.env.local` shapes, the uppercase `.env`-layering axis, empty-value, and duplicate-key closed); this residual is Windows-key-casing-only, dev-workflow-only, and not currently exploitable (no `.env` present, gitignored). Record acceptance in DECISIONS with a follow-up work item, write the gate artifact, close M0.
- (c) Something else / hand off.

**Recommendation (Binkley, no stake in passing):** This is a genuine defect of the same class three prior cycles were spent disarming, on the sanctioned OS, and the fix (case-insensitive key lookup) is small and well-understood. However, the same "one more adjacent vector" pattern has now recurred four cycles running, which is itself a signal — the deeper question for the operator is whether a dotenv-key-parsing wrapper can ever be provably complete, versus a fail-closed posture (REFUSE if ANY parsed key case-folds to `TURSO_DATABASE_URL` with a non-`file:` value, on either file). I surface the finding and both remediation shapes; the strike-4 vs accept-and-move decision is the operator's.

**Answer (recorded 2026-07-15, operator decision):** Option (b) — ACCEPT. F-RG-5 (Windows case-variant `.env` key bypass) is accepted as a low-risk latent gap: the guard is materially hardened (all `.env.local` shapes, the `.env`-layering axis with the complete drizzle-kit env-file set, empty-value and duplicate-key edges closed and gate-probed); this residual is Windows-key-casing-only, dev-workflow-only, and not currently exploitable (no `.env` on disk; `.env*` gitignored). Recorded in DECISIONS **D22** with a deferred fail-closed / case-insensitive hardening follow-up. M0 passes with this accepted residual; the gate artifact is written and M0 closes.

---

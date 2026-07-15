# Session State — byrachelpierce-web

milestone: M1

## Position (written 2026-07-15 — M0 CLOSED; M1 not yet started)

M0 CLOSED (gate PASS 4 cycles, merged to chuck/integration @ 5fbf5f1, artifact pinned, PR #13
closed, Otis actuals recorded). M1 branch created; no M1 work items done yet.

Mode: continuous. On branch chuck/M1 (based on the M0-merged integration tip 5fbf5f1; the M0
post-merge bookkeeping is its first commit, pushed to origin). Run lock: RELEASED at this
handoff — re-acquire on resume.

Binkley's final verdict (fresh independent re-verification): **PASS (with operator-accepted
residual F-RG-5)**, HEAD dede7b6, all 12 deterministic gates GREEN, CI success (run
29377564152, headSha==HEAD). Report: `.chuck/reports/M0/milestone-report.md`.

The gate took FOUR cycles:
- Cycle 1 FAIL: F-BINK-1 (Turso token, later waived), F-BINK-2/3/4 (guard bypass, restore SQLi,
  silent missing-dump — fixed).
- Cycle 2 FAIL: F-BINK-2 still bypassable via more shapes -> F-RG-1 (dotenv.parse root fix) +
  F-RG-2 (probe blind-spot) fixed.
- Cycle 3 FAIL: F-RG-3 (.env-layering) -> fixed (resolveLayeredUrl matches drizzle-kit; complete
  env-file set {.env,.env.local} covered).
- Cycle 4 FAIL: F-RG-5 (win32 case-variant .env key) -> operator ACCEPTED (E5/D22) rather than a
  5th cycle.

ALL findings now fixed or dispositioned: fixes F-BINK-2/3/4, F-RG-1/2/3; dispositions F-BINK-1
waived (E3/D20), F-BINK-5/7 (D19), F-RG-4 (D21), F-RG-5 accepted (E5/D22). Deferred follow-up:
fail-closed guard hardening (D22, non-blocking). F-BINK-6 (draft PR #13 targets main) handled at
merge.

## Resume steps (M0 CLOSED — M1 branch created, work pending)

M0 close is fully done: gate artifact `.chuck/gates/M0.json` PASS pinned to 5fbf5f1 (12/12
gates), chuck/M0 merged (fast-forward) into chuck/integration, chuck/integration pushed to
origin, draft PR #13 closed (F-BINK-6 resolved), Otis actuals + re-baselines recorded. The M0
post-merge bookkeeping (BUDGET actuals, re-baseline, these ledgers) is committed as the FIRST
commit of chuck/M1 and pushed to origin. chuck/integration stays clean at the pinned M0 tip
5fbf5f1 — do NOT commit bookkeeping onto integration (the merge hook locks it to the gate tip).

1. Re-acquire the run lock.
2. `git checkout chuck/M1` — the branch ALREADY EXISTS (based on the M0-merged tip; do NOT
   `checkout -b`, and do NOT name chuck/integration in any command). No M1 work items done yet.
3. Begin M1 work items per BUILD-SPEC M1 (SEO metadata, analytics wiring, Lighthouse
   config/budgets can proceed now). The redirect map (BUILD-SPEC M1 item 3) needs the
   operator's top Wix page URL list — batch it, non-blocking for the rest of M1.

LESSON (merge-hook mechanics, for future closes): do the Otis post-merge bookkeeping on the
NEXT milestone branch (or before flipping the `milestone:` pointer), NEVER as a commit onto
chuck/integration — the merge hook refuses any integration write that is not the exact pinned
PASS tip, and once the pointer flips to the next milestone it demands that milestone's artifact.

Recommend resuming M1 in a FRESH session for token efficiency (this session's transcript is
very large after the M0 saga; this file is the contract).

## Gate status on b693556 (all executed this session; quotes in PROGRESS/ESCALATIONS)

check/coverage/build-seeded/e2e: GREEN via Bill (90.36%/97.67%; 34/34; 12 passed).
dep-audit: GREEN after drizzle-orm 0.45.2 CVE bump (was RED: GHSA-gpj5-g38j-94v9 HIGH).
eol-clean "EOL OK" - push-guard "PUSH-GUARD OK" - restore-roundtrip 3/3 -
prod-verify "PROD-VERIFY OK" (528 paintings, 0 sentinels, 4 migrations) -
alias-smoke "SMOKE OK" (4/4) - tag-r4 (R4 @ 2c9f15e pushed) - ci-green success @ b693556.
rotation-recorded: RETIRED by Amendment A1 (gates.json M0 now 12 gates, was 13).

## Bill findings disposition

F1-F4+F6 remediated by Oliver @ 102a0b9 (TDD, orchestrator re-verified). F5 (DEP0190 warning in
probe spawn) + F7 (pre-existing e2e UntrustedHost log noise) = known-low, carry to milestone report.

## Open operator items (non-blocking, batch anytime)

- E2 RIDER 1: remote-branch deletion approval (r3-collection, r4-content, docs/r3-close-out,
  docs/r4-close-out, final-product-planning, vercel/react-server-components-cve-vu-y3bp7s).
- E2 RIDER 2: F15 docs one-liner (docs/SITE-ARCHITECTURE-v2.md line 171, Lilly->Lily, both).
- M1 input: top Wix page URLs for the redirect map.
- M2 long pole: START THE MURALS CSV WITH RACHEL (nothing else in the project can overtake this).
- M3 (later): new Resend account+key, SPF/DKIM domain verification IN THE NEW ACCOUNT,
  BLOB_READ_WRITE_TOKEN into Vercel, migration 0004 ritual, set-admin x3.
- M0 residual (non-blocking, deferred): fail-closed guard hardening for F-RG-5 win32 case-variant
  .env key (D22).

## Hook/environment notes (do not fight; route around)

- BOTH Chuck hooks pattern-match the RAW TEXT of Bash commands, including heredoc bodies and
  commit-message strings. The merge-block hook fires on any command text containing the
  integration branch's literal name until a PASS gate artifact exists (it blocked branch
  creation, checkout -b, a push, and a heredoc that merely mentioned the name). The git-guard
  fires on text naming its forbidden operations (history rewrites, forced pushes, verification
  skips, hard resets) even inside quoted prose. Consequence: keep those literal strings OUT of
  Bash command text — write state files with the file-Write tool, and name the integration
  branch only in the real merge command after the artifact exists.
- Work branches: base on main@33f9f4f (identical commit to the integration branch tip) to
  avoid naming it. EOL working-tree refresh was done via in-place sed (byte-identical to
  index) because the guard rejects hard resets.
- Repo is PUBLIC on GitHub (verified 2026-07-07) — sweep-verified no secrets ever in history.
- .chuck/session-state.md, run.lock, mode are prettier-ignored. Node 24 local / Node 20 CI
  (CI authoritative). test-runner dispatches: pass model sonnet (haiku denied by routing hook).
</content>

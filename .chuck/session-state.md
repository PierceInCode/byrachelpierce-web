# Session State — byrachelpierce-web

milestone: M2

## Position (written 2026-07-20 — M1 CLOSED + merged; M2 bookkeeping done; M2 build not yet started)

M1 is CLOSED. Final tip chuck/M1 = a317cf1 (scribe close commit, docs-only over the gated 4f97179). Binkley LAST ACT = PASS: CI green on a317cf1, 8/8 deterministic gates re-run green, artifact `.chuck/gates/M1.json` written pinned to a317cf1 (verdict PASS, 8/8). Merged fast-forward to chuck/integration (now a317cf1, pushed to origin). Otis M1 actuals appended to BUDGET + M3/M4 re-baselined (this bookkeeping commit on chuck/M2).

M1 actual: 2,611,448 in/out (input=759,140 output=1,852,308 cache_read=303,288,198 cache_create=8,639,648), UNDER the 4.5M–11.0M band; cumulative 11,862,876; $0 cash; no overrun.

## Current milestone: M2 — Content loop completion (real mural content live)

M2 is the HUMAN-HANDS long pole: the live site needs Rachel's real mural content (the murals CSV — names + descriptions). The agent side is verification only (the `mural-content` gate/probe asserts real content present; pre-content it correctly FAILs — 14/14 names, 0/14 descriptions at last run). Nothing agent-side can COMPLETE M2 until Rachel supplies the content. Expect an immediate human-hands escalation (HT2 content loop) for the murals CSV — in continuous mode, only escalations interrupt.

Branch: chuck/M2 @ a317cf1 (+ this bookkeeping commit).

## RUN STOPPED CLEAN — E7 (human-hands) recorded 2026-07-20, awaiting operator answer

The M2 human-hands blocker is confirmed and escalated: `docs/intake/murals.csv` is EMPTY (14/14 blank), so M2 cannot proceed without Rachel's real content. **ESCALATIONS E7** is written (HT2 content-loop protocol) with an empty `**Answer:**` — the run resumes only after the operator fills it. All M2 agent-side infrastructure is present and green (ingest/export/backup scripts, `mural-content` gate correctly FAILing pre-content). `npm run check` PASS on the bookkeeping tip (206/206 tests, lint/format/typecheck clean, exit 0). Run lock released on the clean stop.

## Resume steps (after the operator answers E7)
1. Re-acquire the run lock.
2. Confirm on chuck/M2; HEAD = the E7-stop commit.
3. Read the operator's HT2 result (`.chuck/human-tests/HT2-result.md`) + E7 `**Answer:**`.
4. If all-pass: run the M2 gate wave (`mural-content` now PASSes on real content, + full deterministic suite) → close M2 (Binkley LAST ACT → merge → Otis). If any HT2 fail: treat as a blocked-gate with the operator's notes.

## Carry-forward NEEDS-SENIOR-REVIEW (accumulate to ship report, NONE blocking)
1. a11y 0.95 zero-margin on matthews-turtle + /murals/trail (pre-existing Header/Footer/EmailSignInForm/MuralMap contrast, not M1-introduced).
2. /collection mobile perf median 0.88 (thin margin above 0.85).
3. server-start races un-retried after retry removal (LHCI runUntilSuccess 3×/URL covers launch — narrow).
4. F-BINK-M1-C3-1: no DECISIONS.md entry documenting the redirect-map decision (paper-trail debt — code correct; decision recorded in ESCALATIONS E6 + commit 4f97179 body + cycle-3 report; the post-approval spec-guard hook blocks agent DECISIONS.md edits).
5. F-BINK-M1-C3-2: trailing-slash requests take a benign 2-hop 308 chain (no link-equity loss).

## Open operator items (non-blocking, batch at next checkpoint)
- E2 RIDER 1: remote-branch deletion approval (r3-collection, r4-content, docs/r3-close-out, docs/r4-close-out, final-product-planning, vercel/react-server-components-cve-vu-y3bp7s).
- E2 RIDER 2: F15 docs one-liner (docs/SITE-ARCHITECTURE-v2.md line 171, Lilly->Lily, both).
- M2 long pole: START THE MURALS CSV WITH RACHEL (nothing else in the project can overtake this).
- M3 (later): new Resend account+key, SPF/DKIM domain verification IN THE NEW ACCOUNT, BLOB_READ_WRITE_TOKEN into Vercel, migration 0004 ritual, set-admin x3.
- M0 residual (non-blocking, deferred): fail-closed guard hardening for F-RG-5 win32 case-variant .env key (D22).

## Hook/environment notes (do not fight; route around)
- BOTH Chuck hooks pattern-match the RAW TEXT of Bash commands, including heredoc bodies and commit-message strings. The merge-block hook fires on any command text containing the integration branch's literal name until a PASS gate artifact exists. The git-guard fires on text naming forbidden operations (history rewrites, forced pushes, verification skips, hard resets) even inside quoted prose. Keep those literal strings OUT of Bash command text — write state files with the file-Write tool.
- Work branches based on integration tip a317cf1. Repo is PUBLIC on GitHub — sweep-verified no secrets ever in history. Node 24 local / Node 20 CI (CI authoritative). test-runner dispatches: pass model sonnet (haiku denied by routing hook).

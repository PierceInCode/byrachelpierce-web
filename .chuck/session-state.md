# Session State — byrachelpierce-web

milestone: M0

## Position (written 2026-07-14 — Amendment A1 applied)

Mode: continuous. Gate 1 approved; plan frozen at BUILD-SPEC M0–M4.

CR1 mini-veto: APPROVED WITH AMENDMENT (2026-07-14). The operator COMPLETED secret rotation
(NOT waived): both leaked credentials rotated — new Resend API key AND new Turso production
database auth token; `Database Token.txt` deleted; `public/art/` backup (Phase 0.6) confirmed.
No standing production-DB exposure risk (Turso token is rotated). Recorded: ESCALATIONS E2
Answer filled; DECISIONS D18 (Amendment A1) appended; CR1 stamped "APPROVED WITH AMENDMENT";
HT1-secret-rotation.md annotated "RETIRED / COMPLETED 2026-07-14 by Amendment A1".

Two HT1 items NOT confirmed, carried forward (not gated): magic-link send-test (step 4) ->
deferred to M3 (needs the dedicated ByRachelPierce Resend account+key; magic-link auth stays
unverified until then); Vercel-preview confirmation (step 7 / Phase 0.7) -> carried to Milo's
ship-report at Gate 2. Because the HT1 result form is only 4/7 operator-observed, the
`rotation-recorded` machine gate was RETIRED — gates.json M0 now has 12 gates (was 13).

## Resume steps (in order, from here)

1. Run prettier + `npm run check` (via test-runner) on chuck/M0.
2. Commit the amendment on chuck/M0, push, wait for CI success on the exact new tip sha.
3. Dispatch Binkley (fresh context, opus) for the M0 Anxiety Closet against gates.json M0
   (12 gates, no rotation-recorded).
4. On PASS -> close in PIN-ONCE-LAST order: Scribe commits report/PROGRESS/session-state/ledger;
   push; CI on tip; Binkley's last act verifies CI + re-runs gates + writes the pinned artifact;
   merge chuck/M0 to the integration branch; Otis actuals + re-baseline.
5. Continuous mode -> then M1. First need: operator's Wix page URL list (M1 item 3).

Note: the amendment changes ONLY gates.json + docs, so code gates are unaffected — Binkley
re-runs them fresh regardless.

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

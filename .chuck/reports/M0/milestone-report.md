# M0 Milestone Gate Report — Binkley (Anxiety Closet) — CONSOLIDATED CLOSE

## Verdict: PASS (with one operator-accepted residual, F-RG-5)

Rule zero: Unexecuted = hypothesis. Every gate result and finding below carries quoted executed
output (in the probe ledger .chuck/probes/M0-ledger.md) or is labeled UNVERIFIED. This report is
pinned to an exact commit; see Pins. The machine-readable gate artifact is written by write-gate.sh
against the final committed tip as Binkley's last act (PIN-ONCE-LAST) — NOT by this report.

## Pins
- Branch chuck/M0 @ HEAD dede7b6b450323efaa5d9616a60aff2bd4c725d8 (gated commit)
- Merge-base 33f9f4f; milestone diff hash (33f9f4f..dede7b6) dbf47f77647da05e8b15d70e9abd8076214567b4
- CI on dede7b6: run 29377564152 headSha == HEAD, conclusion=success, status=completed (gh run view).
- Prior per-cycle reports preserved: milestone-report-cycle1.md, -regate.md, -regate2.md, -regate3.md;
  snorklewacker-cycle1.md, -regate.md, -regate2.md, -regate3.md; bobbi/ronald-ann/steve cycle-1.

## Milestone
M0 — Takeover baseline: audit closure, hygiene debts, production verification.

## Four-cycle history (why this took four gates)
Every cycle failed on the SAME surface — the db:push production-write guard (Iron Rule 1) — but each
cycle's finding was a genuinely distinct, adversarially-surfaced bypass, fixed and verified, not a
re-grind of the same bytes:
- Cycle 1 (gate) FAIL: F-BINK-2 (guard first-match vs dotenv last-match on a duplicate-key .env.local),
  plus F-BINK-3 (restore column-name SQLi) and F-BINK-4 (silent missing-dump). All fixed.
- Cycle 2 (regate) FAIL: guard still bypassable via export-prefix / inline-comment / whitespace+quote
  .env.local shapes (F-RG-1). Fixed at root by resolving through dotenv.parse itself; F-RG-2 (the probe
  modeled only the process.env short-circuit, never the parse branch) fixed.
- Cycle 3 (regate2) FAIL: NEW adjacent vector F-RG-3 — drizzle-kit push also auto-loads a sibling plain
  .env (before .env.local, override=false); the guard read only .env.local. Reached the section-7
  three-strike line -> escalation E4.
- Cycle 4 (regate3): operator authorized ONE more scoped cycle (E4 -> D21). F-RG-3 fixed
  (resolveLayeredUrl models the full .env-then-.env.local resolution) and VERIFIED complete against real
  drizzle-kit across 11 combos. Cycle-4 refutation surfaced F-RG-5 (Windows case-variant .env key) — a
  same-class residual. Operator ACCEPTED F-RG-5 (E5 -> D22) rather than authorize a fifth cycle.
  With F-RG-5 dispositioned, no un-dispositioned finding remains -> PASS.

## Gate results (deterministic — all 12 GREEN on dede7b6; RG4-6, this exact HEAD)
run-gates.sh v1.3.0 gives GATES PASS: M0, results.json all_pass=true. Key output (.chuck/probes/M0.log):

| # | gate | lane | result | evidence |
|---|------|------|--------|----------|
| 1 | check | local | PASS rc0 | lint+format+typecheck+test; 183 tests passed (21 files) |
| 2 | coverage | local | PASS rc0 | 183 tests passed |
| 3 | build-seeded | local | PASS rc0 | compiled successfully; ci.db seeded from migrations + fixtures |
| 4 | e2e | local | PASS rc0 | 12 passed (19.2s) |
| 5 | dep-audit | local | PASS rc0 | 3 moderate severity (below --audit-level=high) |
| 6 | eol-clean | local | PASS | EOL OK |
| 7 | push-guard | local | PASS | PUSH-GUARD OK (4 .env-layering cases assert) |
| 8 | restore-roundtrip | local | PASS rc0 | 3 tests passed |
| 9 | prod-verify | local | PASS | LIVE prod: migrations tracked 4, paintings 528, PROD-VERIFY OK |
| 10 | alias-smoke | local | PASS | SMOKE OK |
| 11 | tag-r4 | local | PASS | R4 |
| 12 | ci-green | ci | PASS | success (run 29377564152 headSha == HEAD) |

## Disposition table — every M0 finding across all four cycles

### FIXED (code present at HEAD dede7b6, verified by re-execution)
| finding | what | verification |
|---------|------|--------------|
| F-BINK-2 | guard first-match vs dotenv last-match (.env.local dup-key) | guard resolves via parseDotenv itself (db-push-dev.ts:33,70); no regex extraction. Present at HEAD. |
| F-BINK-3 | restore column-name SQLi (untrusted dump JSON keys) | assertSafeIdentifier(c) on every dump column before SQL (backup-prod.ts:212). Present; file untouched cycle 4. |
| F-BINK-4 | silent missing-dump (count=0 indistinguishable from empty table) | throws loud "no dump file found ... refusing partial snapshot" (backup-prod.ts:198-203). Present. |
| F-RG-1 | .env.local parse shapes (export/inline-comment/ws+quote) | 4 hostile shapes BLOCK via parse branch, pristine guard (RG4-4/5). |
| F-RG-2 | probe modeled only process.env short-circuit, not parse branch | probe deletes TURSO_DATABASE_URL from child env; 4 .env.local cases assert (push-guard.mjs:129-130). |
| F-RG-3 | .env-layering (sibling .env loaded first, override=false) | resolveLayeredUrl vs REAL drizzle-kit, 11 combos incl empty-value, 0 bypass (RG4-2); 24/24 unit tests; gate probe mutation-verified RED on blind-spot revert (RG4-4). Complete auto-load set = {.env, .env.local} confirmed (RG4-CLASS-1 + Snork 7 real probes). |

### DISPOSITIONED (operator, independently confirmed in the record)
| finding | disposition | record (verified present) |
|---------|-------------|---------------------------|
| F-BINK-1 | Turso token WAIVED (never in public repo; local/AI-history exposure only) | ESCALATIONS E3 Answer + DECISIONS D20 |
| F-BINK-5 | build-tooling licenses (lightningcss MPL-2.0, caniuse-lite CC-BY-4.0) accepted — build-time, not bundled | DECISIONS D19 |
| F-BINK-7 | .prettierignore recorded retroactively (benign, no behavior change) | DECISIONS D19 |
| F-RG-4 | raw npx drizzle-kit push accepted — inherent wrapper limitation | DECISIONS D21 |
| F-RG-5 | Windows case-variant .env key bypass ACCEPTED as low-risk latent gap; deferred fail-closed hardening | ESCALATIONS E5 Answer (Option b) + DECISIONS D22 |
| F-BINK-6 | draft PR #13 -> main handled by orchestrator at merge step | (merge-time, not a code finding) |

## Accepted residual — F-RG-5 (the one thing NOT fixed) and its deferred follow-up
On win32 (the SOLE sanctioned dev OS) process.env keys are case-insensitive, but the guard's definesUrl
(db-push-dev.ts:33) checks the key case-sensitively. A sibling .env with a case-variant key
(turso_database_url=<remote>, Turso_Database_Url=, export turso_database_url=) + .env.local=file: makes the
guard resolve file: -> ALLOW while real drizzle-kit populates process.env and targets the REMOTE. Reproduced
by two independent hermetic real-drizzle-kit executions (Binkley RG4-8 + Snorklewacker regate3 Refutation 1).

Severity/reachability: identical to the already-accepted F-RG-3/F-RG-4 class — no .env on disk (only
.env.local), .env* gitignored (cannot be committed / bad-merged from tracked files); requires a developer to
hand-create a local .env with a case-variant remote key. NOT exploitable as the repo stands today.

Operator disposition (D22 / E5, 2026-07-15): ACCEPTED as a low-risk latent gap. Deferred non-blocking
follow-up: harden the guard to a FAIL-CLOSED posture — refuse the push unless it can positively prove the
effective target is a local file: DB, resolving TURSO_DATABASE_URL case-insensitively across both .env and
.env.local, and extend push-guard.mjs with lowercase/mixed-case cases. Carried for a later maintenance pass.

NEEDS-SENIOR-REVIEW: this residual is surfaced, not buried — it is a real prod-write bypass of a class that
consumed four cycles, closed by operator acceptance rather than by a fix. The deferred hardening item is the
honest debt.

## Coverage manifest
Rule zero: Unexecuted = hypothesis. Anything assertable by running a command was run (output quoted in the
ledger, sections CYCLE 1..RE-GATE CYCLE 4 / RG4) or labeled UNVERIFIED.

### CHECKED
- 12 deterministic gates on dede7b6 — run-gates.sh v1.3.0 gives GATES PASS: M0, all_pass=true (RG4-6); M0.log.
- CI on HEAD — gh run view 29377564152 headSha==dede7b6b, conclusion=success, status=completed (RG4-7).
- F-BINK-2/3/4 fixes present at HEAD — code grep + backup-restore.roundtrip 3 pass; backup-prod.ts untouched cycle 4.
- F-RG-1/2/3 fixes — guard vs REAL drizzle-kit 11 combos 0 bypass; 24/24 unit tests; probe mutation-verified.
- CLOSE-THE-CLASS — complete drizzle-kit auto-load set = {.env, .env.local}; direct bin.cjs read + 7 real probes.
- F-RG-5 residual — reproduced independently (RG4-8), then dispositioned; disposition record read verbatim (D22/E5).
- All dispositions independently confirmed present in the record: D19 (F-BINK-5/7), D20+E3 (F-BINK-1), D21 (F-RG-4),
  D22+E5 (F-RG-5). Not taken on the coordinator's word.
- Source tree pristine — scripts/, tests/ byte-identical to HEAD; guard byte-identical after all cycle-4 mutations.

### NOT CHECKED (debt, not clearance)
- POSIX (non-Windows) behavior of the F-RG-5 bypass — reasoned (case-sensitive process.env => no divergence),
  not executed (no Linux/macOS runner). Windows-scoped; Windows is the sanctioned platform.
- F-RG-5 fail-closed hardening — DEFERRED by operator (D22 follow-up); not implemented, not gated. Recorded debt.
- Full milestone re-wave in cycles 2-4 — deliberately scoped: each remediation diff sat inside its finding set.

### COULD NOT CHECK
- None. prod-verify and alias-smoke both reached live prod read-only and returned OK; every attack probe executed.

## PIN-ONCE-LAST status
PASS rendered on HEAD dede7b6 with all findings fixed-or-dispositioned. Binkley is HOLDING context. The gate
artifact is NOT yet written. The orchestrator commits the close artifacts (this report + PROGRESS +
session-state + probe-ledger + D22 + E5), pushes, and gets CI green on the NEW tip; Binkley's LAST act (same
context) then verifies CI on that tip, re-runs the 12 deterministic gates, and writes the pinned artifact via
write-gate.sh. If any late commit changes HEAD, the gates and CI re-run against the new tip before the artifact.

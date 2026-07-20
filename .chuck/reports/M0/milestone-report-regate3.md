# M0 Re-gate Cycle 4 (regate3) — Milestone Report

Verdict: FAIL (a live prod-write bypass of the SAME F-RG-3 class survives the fix — case-variant
.env key on Windows, the sanctioned platform. The cycle-4 completeness claim is refuted.)

Rule zero: Unexecuted = hypothesis. Every assertion is backed by a quoted executed probe
(ledger .chuck/probes/M0-ledger.md, section RE-GATE CYCLE 4 / RG4-star) or labeled UNVERIFIED.

## Pins
- Branch chuck/M0 @ HEAD dede7b6b450323efaa5d9616a60aff2bd4c725d8
- Merge-base 33f9f4f; milestone diff hash (33f9f4f..dede7b6) dbf47f77647da05e8b15d70e9abd8076214567b4
- Cycle-4 remediation diff dbc8638..dede7b6 = 5 files (db-push-dev.ts, db-push-dev.test.ts, push-guard.mjs,
  DECISIONS.md, ESCALATIONS.md) — fully inside the F-RG-3 finding set, so a SCOPED re-gate was correct.
- CI on dede7b6: run 29377564152 headSha == HEAD, conclusion=success, status=completed (verified gh run view).

## Scope
Operator-authorized cycle 4 (D21 / E4) past the section-7 three-strike line for ONE bounded fix: F-RG-3, the
db:push guard .env-layering gap. Charter: (1) verify F-RG-3 fixed on the uppercase axis; (2) CLOSE THE CLASS —
the COMPLETE set of env files drizzle-kit push auto-loads, and prove the guard covers exactly that set;
(3) regress F-RG-1/2, F-BINK-3/4; (4) one Snorklewacker refutation; (5) all 12 gates.

## Milestone summary
The uppercase-axis fix is real and complete: the new resolveLayeredUrl models drizzle-kit .env-then-.env.local
override=false precedence and matches real drizzle-kit byte-for-byte across 11 combos (incl. the empty-value edge).
The complete auto-load set IS exactly {.env, .env.local} — no .env.production/.development/.test, no .env.vault (no
DOTENV_KEY), no NODE_ENV cascade, no dotenv-expand (verified vs the shipped bin.cjs AND 7 real drizzle-kit probes).
BUT the completeness invariant — byte-identical to what drizzle-kit targets across ALL combos — is FALSE on Windows:
a case-variant .env key (turso_database_url=REMOTE, Turso_Database_Url=, export turso_database_url=) makes the guard
resolve the .env.local file: value and ALLOW, while real drizzle-kit populates a case-insensitive process.env and
targets the REMOTE. Same prod-write bypass class F-RG-3 built the layered resolver to disarm, via a key-casing the
guard never normalizes.

## Gate results (deterministic — RG4-6, all on dede7b6): ALL 12 GREEN
run-gates.sh v1.3.0 gives GATES PASS: M0, results.json all_pass=true. Key output (.chuck/probes/M0.log):
- check + coverage: 183 tests passed (21 files) rc 0
- build-seeded: compiled successfully, ci.db seeded from migrations + fixtures rc 0
- e2e: 12 passed (19.2s) rc 0
- dep-audit: 3 moderate severity vulnerabilities (below high) rc 0
- eol-clean: EOL OK; push-guard: PUSH-GUARD OK (4 .env-layering cases assert); restore-roundtrip: 3 passed
- prod-verify: LIVE prod read — migrations tracked: 4, paintings: 528, PROD-VERIFY OK
- alias-smoke: SMOKE OK; tag-r4: R4; ci-green: success (headSha==HEAD)

The 12 green gates do NOT catch the finding below: every .env-layering case in push-guard.mjs uses an uppercase
TURSO_DATABASE_URL= key, so the probe is structurally blind to the case-fold axis — the gate shares the guard blind
spot. Same "gate blind to a live bypass" pattern that failed cycles 2 and 3, re-appearing on a new axis.

## Findings

### VERIFIED FIXED this cycle
- F-RG-3 uppercase axis — VERIFIED FIXED (RG4-2, RG4-3, RG4-4). Guard resolveLayeredUrl vs REAL drizzle-kit 0.31.10
  across 11 combos: ALL MATCH, 0 bypass. Empty-value edge: .env=TURSO_DATABASE_URL= gives real empty = guard empty,
  both BLOCK (F4 empty-is-effective). 24/24 unit tests pass. Gate probe mutation-verified: reverting to the
  .env.local-only blind spot drives push-guard.mjs RED (exit 1).
- CLOSE-THE-CLASS — CONFIRMED (RG4-CLASS-1 + Snork Refutation 2). Complete drizzle-kit push auto-load set =
  {.env (bin bundled dotenv/config side-effect, default path, override=false), .env.local (drizzle.config.ts:38,
  override=false)}. Zero .env.local/.production/.development/NODE_ENV literals in bin.cjs; .env.vault/DOTENV_KEY gate
  never reached; no dotenv-expand (the expand hits are minimatch braceExpand). Snork ran 7 real-drizzle probes across
  extra-file/NODE_ENV combos: 0 extra-source leaks. resolveLayeredUrl models exactly these two files. Residual
  out-of-band: DOTENV_CONFIG_PATH / dotenv_config_path= argv can redirect the .env default path — same accepted class
  as F-RG-4 (D21), not gated.
- F-RG-1 / F-RG-2 — REGRESSION CLEAN (RG4-4, RG4-5). 4 hostile .env.local shapes BLOCK, file: ALLOWs on the pristine
  guard, via the parse branch (process.env deleted from child env).
- F-BINK-3 / F-BINK-4 — REGRESSION CLEAN (RG4-5). scripts/backup-prod.ts UNTOUCHED this cycle (empty diff
  dbc8638..dede7b6). At HEAD: every dump-JSON column routed through assertSafeIdentifier (line 212) before SQL
  (F-BINK-3); missing-dump throws loud rather than committing count=0 (line 198-203, F-BINK-4). roundtrip 3 passed.
  (tests/backup-prod.test.ts does not exist — reported, not a pass.)

### NEW — the FAIL finding (NEEDS-SENIOR-REVIEW)
- F-RG-5 (HIGH, prod-write path / Iron Rule 1) — REPRODUCED independently by Binkley (RG4-8) and by the Snorklewacker
  (regate3 Refutation 1). A case-variant TURSO_DATABASE_URL key in a sibling .env (turso_database_url=REMOTE,
  Turso_Database_Url=, export turso_database_url=), with .env.local holding a safe file: and no process var, makes the
  SHIPPED guard resolveLayeredUrl resolve file:./dev.db to ALLOW (it exec-s npx drizzle-kit push), while REAL
  drizzle-kit 0.31.10 resolves the remote and would push an unreviewed schema diff at production.
  - Root cause: db-push-dev.ts:33 definesUrl decides .env precedence with a CASE-SENSITIVE
    hasOwnProperty(TURSO_DATABASE_URL) on the dotenv-parsed object (resolveEffectiveUrl:71 reads
    parsed.TURSO_DATABASE_URL, also case-sensitive). drizzle.config.ts:53 reads process.env.TURSO_DATABASE_URL, and on
    win32 process.env is CASE-INSENSITIVE, so a lowercase/mixed .env key populates the uppercase read.
  - Binkley re-execution (RG4-8): (1) win32 set turso_database_url then read .TURSO_DATABASE_URL = libsql://prod.invalid;
    (2) shipped resolveLayeredUrl on the case-variant .env gives file:./dev.db ALLOW (both lower and mixed case);
    (3) real drizzle-kit on the same pair gives RESOLVED_TURSO_URL=libsql://prod.invalid.
  - Platform scope: Windows-specific — and Windows 11 is the SOLE sanctioned dev environment (CLAUDE.md). On POSIX the
    uppercase read is undefined and real drizzle falls to .env.local file: (no divergence). The bypass exists exactly
    where the project runs. POSIX behavior reasoned, not executed (NOT CHECKED — no non-Windows runner).
  - Exploitability (calibration): identical to F-RG-3 — no .env on disk (only .env.local), .env* gitignored, so it
    cannot be committed / bad-merged from tracked files; requires a developer to manually create a local .env with a
    case-variant remote key. Not exploitable as the repo stands today, but it is the exact loaded-gun class this fix
    was authorized to close.

## Verdict rationale
Cycle 4 (D21/E4) was authorized for ONE bounded outcome: make the guard replicate drizzle-kit env resolution so its
resolved URL matches drizzle-kit actual target, and extend the gate to catch the class. On the uppercase axis that
outcome is met. But the class is NOT closed: a case-variant key on the sanctioned OS is a live prod-write bypass of
the identical F-RG-3 class, verified by two independent hermetic real-drizzle-kit executions. A green gate suite
cannot soften this — the gate is itself blind to the case-fold axis. Verdict: FAIL. No artifact.

## Section-7 escalation posture — FOURTH failed cycle, past an already-extended line
This is cycle 4. The section-7 three-strike line was reached at cycle 3 (E4) and extended ONCE by explicit operator
decision (D21) for this bounded fix. That extended cycle now also FAILs — on a NEW axis of the same class, not a
re-grind of the same bytes. Per section 7 I do NOT grind a further cycle unilaterally. I write a structured escalation
(ESCALATIONS E5) and hand off. The remediation is bounded and named, but authorizing a 5th cycle is an operator
judgment call I surface, not one I take.

## Remediation direction (if operator elects a 5th cycle — NOT auto-authorized)
definesUrl / resolveEffectiveUrl / resolveLayeredUrl must resolve TURSO_DATABASE_URL the way the target platform
process.env surfaces it — a case-insensitive key lookup on win32 (scan parsed keys case-insensitively for the
TURSO_DATABASE_URL name in definesUrl and the value reads). Extend push-guard.mjs check (5) with lowercase/mixed-case
.env-key cases so the gate catches the class. Bounded change: db-push-dev.ts + push-guard.mjs + tests. Consider also
whether the guard should REFUSE if ANY parsed .env/.env.local key case-folds to TURSO_DATABASE_URL with a non-file:
value (fail-closed).

## Coverage manifest
Rule zero: Unexecuted = hypothesis. Anything assertable by running a command was run (output quoted in the ledger,
RG4 section) or labeled UNVERIFIED.

### CHECKED
- 12 deterministic gates on dede7b6 — run-gates.sh v1.3.0 gives GATES PASS: M0, all_pass=true (RG4-6); M0.log.
- CI on HEAD — gh run view 29377564152 headSha==dede7b6b, conclusion=success, status=completed (RG4-7).
- F-RG-3 uppercase axis fixed — guard vs REAL drizzle-kit, 11 combos, 0 bypass incl. empty-value edge (RG4-2);
  24/24 unit tests (RG4-3); gate probe mutation-verified RED on the blind-spot revert (RG4-4).
- CLOSE-THE-CLASS — complete auto-load set {.env, .env.local}; direct bin.cjs read (RG4-CLASS-1) + Snork 7 real
  drizzle-kit extra-file probes (0 leaks) + no dotenv-expand.
- F-RG-1/2 regression — 4 hostile .env.local shapes BLOCK via parse branch, pristine guard (RG4-4/5).
- F-BINK-3/4 regression — backup-prod.ts untouched; assertSafeIdentifier + missing-dump throw present; roundtrip 3 pass (RG4-5).
- F-RG-5 case-variant bypass — Binkley independent 3-part re-execution (RG4-8) + Snork Refutation 1 spot-checked, CONFIRMED.
- Repo integrity — source tree (scripts/, tests/) pristine after all mutations/scratch; guard byte-identical to HEAD.

### NOT CHECKED (debt, not clearance)
- POSIX (non-Windows) behavior of the F-RG-5 bypass — reasoned, NOT executed (no Linux/macOS runner). Windows-scoped;
  does not weaken the finding (Windows is sanctioned).
- Shipped guard main() end-to-end spawn against a hermetic case-variant .env — main() reads ../.env relative to the
  script dir; exercising it would require writing a real .env in the repo tree (refused). Substituted by two executed
  proofs (shipped resolveLayeredUrl on the bytes + real drizzle-kit on the file pair).
- Full milestone re-wave — deliberately not run: remediation diff (5 files) fully inside the F-RG-3 finding set.

### COULD NOT CHECK
- None. prod-verify and alias-smoke both reached live prod read-only and returned OK; every attack probe executed.

### Disposition of prior findings (do-not-recheck, per dispatch)
- F-RG-4 (raw npx drizzle-kit push) — ACCEPTED per D21; not re-flagged.
- F-BINK-1 (Turso token) — WAIVED per E3/D20; not re-probed.
- F-BINK-5/7 dispositioned (D19); F-BINK-6 handled at close.

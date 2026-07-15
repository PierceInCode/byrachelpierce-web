# M0 Re-gate Cycle 3 (regate2) — Milestone Report

Verdict: FAIL (new adjacent surface — .env precedence bypass; 3-strike escalation line reached)

Rule zero: Unexecuted = hypothesis. Every assertion is backed by a quoted executed probe
(ledger .chuck/probes/M0-ledger.md, section RE-GATE CYCLE 3) or labeled UNVERIFIED.

## Pins
- Branch chuck/M0 @ HEAD dbc86383131996f7590412cdbf32bd14424aa20d
- Merge-base 33f9f4f; milestone diff hash 87de9559ffa6ced945940fb04ec08ccedea4cae9
- Cycle-3 remediation diff de0c8ba..dbc8638 = 4 files (push-guard.mjs, .prettierignore, db-push-dev.ts, db-push-dev.test.ts) — fully inside the finding set, so scoped re-gate.
- CI on dbc8638: completed / success, run headSha == HEAD (verified gh run list).

## Milestone summary
Cycle-3 remediated the cycle-2 FAIL (F-RG-1: the db:push:dev guard hand-rolled .env.local regex diverged from dotenv/drizzle-kit) by having resolveEffectiveUrl parse .env.local with dotenv.parse() itself. Sound by construction for the .env.local axis. But the adversarial refutation surfaced a NEW adjacent bypass on the same guard: drizzle-kit push also auto-loads a plain .env (loaded first, override=false), which the guard never inspects — a sibling .env with a remote URL makes the guard say safe while drizzle-kit pushes remote. Verified by independent re-execution.

## Gate results (deterministic — RG3-1, all on dbc8638): ALL 12 GREEN
check, coverage, build-seeded, e2e, dep-audit (3 moderate < high), eol-clean (EOL OK),
push-guard (4 hostile .env.local shapes BLOCK, file: ALLOW, PUSH-GUARD OK), restore-roundtrip (3 tests),
prod-verify (live: 4 migrations, dim cols, 528 paintings, PROD-VERIFY OK), alias-smoke (4 routes 200, SMOKE OK),
tag-r4 (R4), ci-green (success, headSha==HEAD).
The gate suite does NOT catch F-RG-3: the push-guard probe models only .env.local, never a sibling .env (the gate shares the guard blind spot).

## Findings

### RESOLVED this cycle (verified)
- F-RG-1 — VERIFIED FIXED (RG3-2). Guard resolveEffectiveUrl vs real dotenv 16.6.1 across 12 .env.local shapes (3 cycle-2 bypasses + 9 new: single-quote, multiline-dq, escaped-newline, dollar-brace expansion, mixed-adornment duplicates, CRLF, tab-before-value, file:-last ALLOW, only-commented undefined). 0 bypasses; byte-identical to dotenv every case. Correct by construction (guard delegates to dotenv itself).
- F-RG-2 — VERIFIED FIXED for the .env.local axis (RG3-3). Mutation proof: naive first-match resolver (the cycle-2 bug) caught 3/3; probe deletes TURSO_DATABASE_URL from child env (push-guard.mjs 102-103), forcing the parse branch.
- F-BINK-3 (column-name SQLi) / F-BINK-4 (missing-dump throw) — REGRESSION CLEAN (RG3-4). scripts/backup-prod.ts untouched this cycle (empty diff de0c8ba..dbc8638); named tests pass. 29 pass.
- RG-A (check false-red) — FIXED. .prettierignore excludes .chuck/reports/, .chuck/probes/*.{md,log,json}, .chuck/now; check gate GREEN.

### NEW — the FAIL findings (NEEDS-SENIOR-REVIEW)
- F-RG-3 (HIGH, prod-write path / Iron Rule 1) — REPRODUCED (RG3-6). Guard readEnvLocal() reads ONLY .env.local, but the real drizzle-kit push binary auto-loads a sibling plain .env FIRST into process.env (dotenv override=false), so .env wins. Independent hermetic re-execution: .env=libsql://remote + .env.local=file:./dev.db -> real drizzle-kit resolves the REMOTE .env value; guard resolves file:./dev.db -> ALLOWs the push. A control subdir (config loading no env) proved the BIN auto-loads .env. The invariant byte-identical-to-drizzle-kit-target is FALSE whenever a sibling .env defines TURSO_DATABASE_URL.
  Exploit conditions (probed): NO .env file currently exists (only .env.local); both gitignored, so .env cannot be committed / cannot arrive via bad-merge of tracked files. Requires a developer to manually create a local .env with a remote URL. NOT exploitable as the repo stands today, but it is the exact loaded-gun hazard class F8/D7 built the guard to disarm, via a file the guard never inspects, with drizzle.config.ts:9 advertising npx drizzle-kit push.
- F-RG-4 (MEDIUM) — CONFIRMED (RG3-7). drizzle-kit binary present in node_modules/.bin/; guard wraps only the db:push:dev npm-script route. Raw npx drizzle-kit push bypasses the guard entirely — the route F-RG-3 rides. drizzle.config.ts:9 and src/db/schema.ts:22 still advertise the raw command.

## Remediation direction (if operator elects a 4th cycle)
Guard should resolve via the SAME layered load drizzle-kit performs (.env then .env.local, override=false), and/or REFUSE if any .env/.env.* sibling defines a non-file: TURSO_DATABASE_URL. Extend the push-guard probe to create a sibling .env and assert BLOCK. drizzle.config.ts:9 / src/db/schema.ts:22 stale guidance -> DECISIONS entry. Bounded change: db-push-dev.ts + push-guard.mjs + tests.

## 3-strike escalation note
Re-gate cycle 3. Per binkley.md section 7, three failed cycles is the escalation line; the 4th grind is not automatic. Material distinction for the operator: cycles 1-2 failed on the .env.local AXIS of this guard, now genuinely fixed and verified. This cycle FAIL is a NEWLY-SURFACED ADJACENT vector (a different env file the guard never modeled), not the same finding grinding a third time. strike-3-escalate vs distinct-new-issue-one-more-cycle is an operator judgment call. I surface it; I do not grind a fourth time unilaterally. See ESCALATIONS.md.

## Coverage manifest
Rule zero: Unexecuted = hypothesis.

CHECKED
- 12 deterministic gates on dbc8638 — run-gates.sh -> GATES PASS: M0 (RG3-1); outputs in M0.log.
- F-RG-1 fixed — 12-shape guard-vs-dotenv matrix, 0 bypasses (RG3-2).
- F-RG-2 fixed (.env.local axis) — mutation proof, probe forces parse branch (RG3-3).
- F-BINK-3/4 regression — backup-prod.ts untouched + named tests pass (RG3-4).
- Claim-3 script/hook surface — no db:push, no lifecycle hooks; only guarded route is db:push:dev (RG3-5).
- F-RG-3 .env-precedence bypass — real drizzle-kit runtime + guard comparison + bin-auto-load control (RG3-6), independent of Snorklewacker.
- F-RG-4 raw-binary route + CLAIM-2 overreach corroboration (RG3-7).
- CI on HEAD sha — gh run list headSha == dbc8638, success.
- Snorklewacker report read; 3 load-bearing claims spot-checked by re-execution (snorklewacker-regate2.md).

NOT CHECKED (debt, not clearance)
- .env.production/.development/.local.* precedence — proved .env beats .env.local; other variants not enumerated (bin auto-loads only .env by default; lower risk).
- Guard main() SUCCESS path (actual spawn of drizzle-kit push against a real file: dev.db) — decision logic + refusal path tested; spawn is thin, outside the finding set.
- Full milestone re-wave — deliberately not run: remediation diff (4 files) fully inside the finding set.

COULD NOT CHECK
- None. prod-verify and alias-smoke both reached live prod read-only and returned OK.

Disposition of prior findings (do-not-recheck, per dispatch)
- F-BINK-1 (Turso token) — closed by operator WAIVER (E3 / D20). Not re-probed.
- F-BINK-5/7 — dispositioned (D19). F-BINK-6 — handled at close.

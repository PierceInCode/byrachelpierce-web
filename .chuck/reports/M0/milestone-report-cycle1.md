# M0 Milestone Gate Report, Binkley (Anxiety Closet)

Rule zero: Unexecuted = hypothesis. Every gate/finding below carries quoted executed output or is labeled UNVERIFIED. This report is pinned to an exact commit; see Pins.

## Verdict: FAIL

All 12 deterministic gates are GREEN on HEAD, and CI is green on the exact commit under review, but green gates are necessary, not sufficient. Four executed, reproduced findings land in exactly the two places the M0 Definition of Done requires probe-proven (the db:push guard and the backup/restore path) plus the rotation clause, and the deterministic gates do not probe those gaps. The milestone is not done as specified. No machine gate artifact is written (FAIL). Findings route to Oliver for TDD remediation.

## Pins

- Branch chuck/M0 @ HEAD acd4bbd24fa5600978bd280f34cd58f75cff5004
- Milestone-diff base (merge-base): 33f9f4f91474093162e5b799767c2939d60283a6
- Diff hash: 733832265081d7b6a643ac8407d76b0930f2853a
- gates.json M0 = 12 gates (rotation-recorded retired per DECISIONS D18/Amendment A1, confirmed at HEAD, by design)
- Working tree clean on tracked files at gate time.

## Gate results (deterministic, raw output in .chuck/probes/M0.log, HEAD acd4bbd)

| Gate              | Result                | Key quoted output                                                                                           |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| check             | PASS                  | Test Files 21 passed (21) / Tests 168 passed (168); lint/prettier/tsc clean; rc=0                           |
| coverage          | PASS                  | Stmts 89.49 / Branch 84.39 / Funcs 97.67 / Lines 90.36 (>=80/80 floor held); rc=0                           |
| build-seeded      | PASS                  | Generating static pages (34/34); Compiled successfully; rc=0                                                |
| e2e               | PASS                  | 12 passed (24.1s); rc=0 (UntrustedHost noise = F7, non-fatal)                                               |
| dep-audit         | PASS                  | rc=0 at --audit-level=high; high 0 critical 0 moderate 3; drizzle CVE GHSA-gpj5-g38j-94v9 RESOLVED (0.45.2) |
| eol-clean         | PASS                  | files with CRLF working-tree endings: 0 / EOL OK                                                            |
| push-guard        | PASS (see F-BINK-2)   | db:push:dev vs libsql URL exit 1 / PUSH-GUARD OK. GREEN but guard bypassable off-gate                       |
| restore-roundtrip | PASS (see F-BINK-3/4) | Tests 3 passed (3); rc=0. GREEN but does not cover the two restore defects                                  |
| prod-verify       | PASS                  | migrations tracked 4 / paintings 528 / sentinel rows 0 / PROD-VERIFY OK (LIVE prod, D8)                     |
| alias-smoke       | PASS                  | / 200, /collection 200, /murals 200, /murals/trail 200 / SMOKE OK (LIVE prod, D8)                           |
| tag-r4            | PASS                  | R4 (tag at 2c9f15e, pushed to origin)                                                                       |
| ci-green          | PASS                  | success, run 29366157728, headSha acd4bbd (EXACT HEAD verified via gh run list --commit), completed         |

Deterministic runner verdict: GATES PASS: M0. CI on the commit under review: green (verified on exact sha, Kaylee-check satisfied).

## Findings (all executed and independently spot-checked by Binkley; every one reproduces)

### F-BINK-1: Secret rotation not verifiably complete; live prod Turso token predates the claimed rotation. IMPORTANT / NEEDS-SENIOR-REVIEW

Owner: Snorklewacker (corroborated Bobbi F-B3). Spot-check: SC1, SC4 (reproduce).
D18/Amendment A1 records the Turso production token as rotated 2026-07-14 (new token created, prior invalidated); HT1 requires updating .env.local. Executed evidence contradicts this:

- .env.local CreationTime == LastWriteTime == 2026-07-04 22:47:28, never rewritten since (Get-Item, SC1). LastAccessTime tracks today from probe reads, proving write-tracking works.
- The commented prod TURSO_AUTH_TOKEN in .env.local is an EdDSA JWT with iat 2026-03-01T18:19:43Z, exp none (decoded header/claims only; secret value never printed; SC4).
- That token STILL authenticates against live production right now (prod-verify.mjs, PROD-VERIFY OK, run repeatedly).
  Two readings, both bad: (a) a new token was created in the Turso dashboard but .env.local was never updated, so M0 gates authenticate with the pre-rotation token, and if that is the leaked credential the leak is NOT closed; or (b) no rotation-driven edit ever happened. The M0 DoD substantive requirement (secrets rotated) and Invariant 3 are not verifiably satisfied. The distinguishing artifact (Turso token-audit log / operator exact edit timestamp) is outside session reach: COULD NOT CHECK which reading is true; both refute A1 no-standing-exposure framing. NEEDS-SENIOR-REVIEW: operator must confirm (i) the token in .env.local is the post-2026-07-14 token, and (ii) the pre-rotation/leaked token is actually invalidated at the provider.

### F-BINK-2: db:push guard can be BYPASSED on a duplicate-key .env.local. MAJOR

Owner: Ronald-Ann Finding 1. Spot-check: SC9 (reproduced LIVE by Binkley).
scripts/db-push-dev.ts resolveEffectiveUrl (line 44-47) uses first-match (.match, m flag, no g), resolving the FIRST active TURSO_DATABASE_URL line. drizzle-kit push loads env via dotenv (last-match-wins). With two active lines (file:./dev.db then libsql), the guard reads file and ALLOWS the push while drizzle-kit targets the REMOTE URL. Reproduced with the exact shipped regex plus real dotenv.parse: guard resolves file:./dev.db (ALLOW); dotenv resolves libsql prod host (REMOTE): GUARD BYPASSED. This is the F8/D7 loaded gun the guard exists to disarm, and push-guard is the DoD named highest-severity closure 1 probe-proven. The gate passes because it only tests the single-value case. Not an active incident (single-line .env.local today) but a real trust-boundary gap in M0-shipped hardening code. Fix (Oliver): resolve LAST match (mirror dotenv) or shell out to the same dotenv.config drizzle uses; add a duplicate-key test.

### F-BINK-3: SQL injection via unsanitized column names in restoreTables. MAJOR

Owner: Bobbi F-B1. Spot-check: SC3 (reproduced LIVE by Binkley).
scripts/backup-prod.ts restoreTables (line 202) interpolates dump-file JSON column names directly into SQL (colList from Object.keys(row), wrapped only in double quotes); assertSafeIdentifier guards only the table name (line 191), never columns, contradicting the function doc comment claiming every identifier comes from the fixed BACKUP_TABLES constant. Reproduced live in a scratch file DB: a hostile column-name key broke out of the column-list quoting and landed an attacker-chosen row (id 999, name pwned), bypassing the bound placeholder args. Not live-reachable (input is a trusted local dump) but it is the disaster-recovery path with zero test coverage and a false safety claim. restore-roundtrip (DoD highest-severity closure 2 probe-proven) does not cover it. Fix (Oliver): route column names through assertSafeIdentifier or a schema-derived allowlist; add an adversarial-dump test.

### F-BINK-4: restoreTables silently reports missing dump as empty-but-successful. MAJOR

Owner: Ronald-Ann Finding 2. Spot-check: consistent with backup-prod.ts 193-196 read; R-A reproduced with quoted output (SC10).
restoreTables returns counts[file]=0 and continues for any table whose dump file is missing, commits the transaction, and gives the caller no way to distinguish skipped from genuinely empty. Reproduced: source trail_completions 1, dump deleted, restore, dest 0, no error, tx committed. Only tables with FK dependents throw (accidental, schema-shape-dependent). A silent fallback in the production-recovery path an operator reaches for under stress. restore-roundtrip does not test the missing-dump case. Fix (Oliver): fail loud (or explicitly warn) on a missing dump for a table expected present; add a missing-dump test.

### F-BINK-5: Non-permissive licenses in the production dependency tree vs D10 allowlist. NEEDS-SENIOR-REVIEW

Owner: Steve F1. Spot-check: SC6 (reproduce).
lightningcss 1.31.1 plus lightningcss-win32-x64-msvc 1.31.1 (MPL-2.0, via tailwindcss/postcss to tailwindcss/node) and caniuse-lite 1.0.30001800 (CC-BY-4.0, via next) are in the --omit=dev tree, outside D10 allowlist (MIT/Apache-2.0/BSD/ISC). Both build-time-only tooling (zero app-source references). Genuine gap against D10 literal wording; practical liability low (MPL file-level copyleft; CC-BY data-attribution). Operator/legal judgment on whether production dependency tree means runtime-bundle or everything npm ls --omit=dev prints; not resolvable by a probe.

### F-BINK-6: M0 DoD merged chuck/integration to main clause not satisfied at HEAD. EXPECTED pre-merge / process NEEDS-SENIOR-REVIEW

Owner: Bobbi F-B2. Spot-check: SC2 (reproduce).
origin/main 33f9f4f (base, unmoved); no origin/chuck/integration; local chuck/integration 33f9f4f; chuck/M0 NOT an ancestor of integration; PR 13 is DRAFT targeting main directly. The integration merge is the orchestrator POST-PASS step (PIN-ONCE-LAST), so its absence at gate time is EXPECTED, not a defect, consistent with PROGRESS.md next-step note. Process note for whoever merges: PR 13 targets main directly rather than the two-stage chuck/M0 to chuck/integration to main flow Invariant 2 describes: NEEDS-SENIOR-REVIEW (deliberate D4 alt-b simplification, or unresolved gap? No DECISIONS entry records a switch).

### F-BINK-7: .prettierignore added but not itemized in any M0 work item / DECISIONS entry. NIT

Owner: Bobbi F-B6. Spot-check: SC5 (reproduce). New 3-line file in the diff, not named in BUILD-SPEC work item 4, no DECISIONS entry (rule-10 ambiguity-protocol miss). Contents benign (excludes generated/vendored files from Prettier). Non-blocking.

### F-BINK-8: F15 (Lilly to Lily) and RIDER-1 stale-branch deletion still open. MINOR (operator-only, explicitly non-blocking)

Owner: Bobbi F-B4. docs/SITE-ARCHITECTURE-v2.md still has the typo (agents cannot edit docs/); all 6 audit-section-2 stale remote branches still present. Both explicitly carried OPEN as non-blocking per ESCALATIONS E2 answer; the DoD F1-F16 closed or operator-waived is optimistic: honest state is open, operator-owned, non-blocking.

## Carried findings (Bill M0 stress run, confirmed still just noise)

- F5 (DEP0190 warning from push-guard child spawn): non-load-bearing, probe still exits 1 and prints PUSH-GUARD OK; spawn args static literals. Noise.
- F7 (e2e UntrustedHost log noise): non-load-bearing, all 12 e2e tests pass. Noise.

## Confirmed clean (adversarially, by executed probe)

- drizzle CVE GHSA-gpj5-g38j-94v9 resolved (0.45.2; GitHub advisory first_patched 0.45.2; not in vuln list).
- dep-audit honest: high 0, critical 0, 3 moderates only (--audit-level=high not suppressing a high).
- next-auth pinned exactly 5.0.0-beta.25 (Invariant 6); suggested beta.31 bump correctly NOT applied.
- secret-sweep CLEAN (65381 history lines); no secret-shaped string in diff or probe output; Database Token.txt absent. Truncated dead-key prefix in ESCALATIONS/HT1 does NOT trip the absolute sweep (below threshold).
- prod-verify / alias-smoke fail LOUD on unreachable/non-200/empty inputs; not vacuous gates.
- F16 dedupe done (single tailwindcss/postcss 4.2.1).
- gates.json M0 = 12 gates, rotation-recorded correctly removed (D18/A1); BUILD-SPEC stale 13-row table amended-by-reference per A1 (by design, not flagged).

## Coverage manifest, Binkley consolidated

Rule zero: Unexecuted = hypothesis. Anything assertable by a command was run (output quoted) or labeled UNVERIFIED.

### CHECKED

- All 12 deterministic gates: run-gates.sh M0; raw output .chuck/probes/M0.log; results table above.
- CI on exact HEAD sha: gh run list --commit acd4bbd, run 29366157728 success, headSha acd4bbd (Kaylee-check).
- F-BINK-1 rotation timing: .env.local timestamps (SC1) plus JWT iat decode (SC4) plus live prod-verify.
- F-BINK-2 push-guard bypass: replicated shipped regex vs real dotenv.parse on duplicate-key content (SC9).
- F-BINK-3 SQLi: live scratch-DB replay of restoreTables with hostile column name (SC3), injected row landed.
- F-BINK-5 licenses: node_modules licenses plus npm ls --omit=dev (SC6).
- F-BINK-6 integration-merge state: git ls-remote, merge-base --is-ancestor, gh pr view 13 (SC2).
- F-BINK-7 prettierignore: diff plus grep DECISIONS/BUILD-SPEC (SC5).
- Confirmed-clean items: drizzle CVE, secret-sweep (SC7), next-auth pin, F16 dedupe, probe fail-loud behavior.
- Delegate spot-checks: every delegate load-bearing finding re-executed by Binkley; all reproduce; NO report failed spot-check, no re-dispatch (Bobbi, Ronald-Ann, Steve, Snorklewacker; ~1/3 sample plus all load-bearing).

### NOT CHECKED

- F-BINK-4 missing-dump silent restore: reproduced by Ronald-Ann with quoted output and consistent with source read; Binkley did not independently re-run this specific scratch scenario (owner-verified plus code-consistent). Debt, not a pass.
- Mutation-kill tests on restore-roundtrip / push-guard success branch: flagged not executed; tests read sound but not adversarially mutated.
- run-gates.sh contains matcher rc-blindness (Snorklewacker 1e): real runner design weakness, but no M0 gate exploits it (each probe gates its OK token behind a fail-count). Harness concern, not an M0 diff defect. Debt logged.
- M1-M4 probes present in the diff: not M0-gated; read for shape, not executed.
- backup-check.mjs dateOf substring-match on -superseded- filenames (Bobbi UNVERIFIED): M2 gate, out of M0 scope; carried to M2.
- Provider-side rotation attestation (Resend/Turso dashboards): no repo-side probe reaches third-party account state.

### COULD NOT CHECK

- Which of F-BINK-1 two readings is true: turso db tokens list / dashboard token-audit log unavailable in this environment (no Turso cloud CLI per user memory; the libsql client cannot introspect its own token creation history). Command that would settle it: Turso token-audit API OR operator confirmation of the exact .env.local edit timestamp. This is why F-BINK-1 is NEEDS-SENIOR-REVIEW, not a flat assertion.
- Whether libsql HTTP client could embed the auth token in a thrown Error.message in backup-prod.ts catch (Steve, speculative): no safe way to force that error path against production under D8.

## Remediation (FAIL, Oliver, TDD)

Fix set: F-BINK-2 (guard last-match / single-source-of-truth plus duplicate-key test), F-BINK-3 (column-name sanitization plus adversarial-dump test), F-BINK-4 (fail-loud on missing dump plus test). F-BINK-1 requires operator action (confirm/redo Turso rotation plus update .env.local), then re-probe the JWT iat. F-BINK-5, F-BINK-6 (process), F-BINK-7 are NEEDS-SENIOR-REVIEW / operator decisions, not Oliver code fixes. Re-gate is scoped per Binkley protocol section 7: each cycle-1 finding verified fixed by its owner-verifier, one fresh-eyes review of the remediation diff, one Snorklewacker refutation that the fixes are real; deterministic gates re-run in full.

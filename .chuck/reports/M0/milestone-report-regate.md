# M0 SCOPED RE-GATE Report (cycle 2) - Binkley (Anxiety Closet)

Rule zero: Unexecuted = hypothesis. Every gate/finding carries quoted executed output or is labeled UNVERIFIED.

## Verdict: FAIL

F-BINK-3 and F-BINK-4 are genuinely fixed (proven red-to-green, adversarially re-attacked, both hold). F-BINK-2 is NOT completely fixed: the db:push guard is still bypassable on three real .env.local shapes, independently reproduced by Binkley against real dotenv 16.6.1 - and its certifying gate (push-guard.mjs) is structurally blind to the fix, so a green gate and green unit tests coexist with a live production-push bypass. All 12 deterministic gates are green on the committed HEAD tree and CI is green on the exact commit, but a green gate is necessary, not sufficient. No machine gate artifact is written (FAIL). F-BINK-2 returns to Oliver for cycle-2 TDD remediation.

## Pins
- Branch chuck/M0 @ HEAD de0c8ba0db290c3ac7d71c4f526c493e1e2d9d4c
- Merge-base: 33f9f4f91474093162e5b799767c2939d60283a6
- Diff hash (git diff 33f9f4f..de0c8ba piped to git hash-object): 407c290a11667576d852937e43737f1bd10bdd25
- Remediation commit: ed2aae5 (plus D20/E3 waiver records at de0c8ba)
- Cycle-1 report (the FAIL re-gated): .chuck/reports/M0/milestone-report.md
- Scope per binkley.md section 7: owner verify-fixed + remediation-diff fresh-eyes + one Snorklewacker refutation; deterministic gates re-run in full.

## Gate results (deterministic, HEAD de0c8ba; raw output .chuck/probes/M0.log)

| Gate | Result | Key quoted output |
| --- | --- | --- |
| check | GREEN (committed tree) | Runner reported FAIL: prettier flagged UNTRACKED Binkley artifacts (M0-ledger.md, M0-results.json). With artifacts aside: lint clean / prettier all-clean / tsc clean / 171 tests pass / rc=0. See RG-A. |
| coverage | PASS | Test Files 21 passed (21) / Tests 171 passed (171); Stmts 89.49 / Branch 84.39; rc=0 |
| build-seeded | PASS | Generating static pages (34/34); Compiled successfully; rc=0 |
| e2e | PASS | 12 passed (20.4s); rc=0 (UntrustedHost noise = F7, non-fatal) |
| dep-audit | PASS | rc=0 at --audit-level=high; 3 moderates only; no high/critical |
| eol-clean | PASS | CRLF working-tree endings: 0 / EOL OK |
| push-guard | PASS but BLIND (see F-RG-2) | db:push:dev vs libsql URL exit 1 / PUSH-GUARD OK. GREEN but never exercises the F-BINK-2 branch |
| restore-roundtrip | PASS | Tests 3 passed (3); rc=0 |
| prod-verify | PASS | migrations tracked 4 / paintings 528 / sentinel rows 0 / PROD-VERIFY OK (LIVE prod D8; re-run RG-16) |
| alias-smoke | PASS | / 200, /collection 200, /murals 200, /murals/trail 200 / SMOKE OK (LIVE prod D8) |
| tag-r4 | PASS | R4 to 2c9f15e |
| ci-green | PASS | success; run 29371493553 headSha de0c8ba (EXACT HEAD, Kaylee-check RG-2/RG-15); completed |

The runner exit was 1 solely on the check false-red; the committed HEAD tree passes all 12. That does not lift the FAIL - the FAIL is the F-BINK-2 finding, which the gates do not probe.

## Findings

### F-RG-1: F-BINK-2 db:push guard is still bypassable (last-match fix INCOMPLETE). MAJOR - carry to Oliver
Owner: Snorklewacker Claim A; independently reproduced by Binkley (RG-18). resolveEffectiveUrl now takes the LAST active TURSO_DATABASE_URL match to mirror dotenv last-wins, closing the unadorned duplicate-key case (a real improvement; control row is not a bypass). But the guard regex does not model what dotenv v16 does: (1) strips an export prefix; (2) strips an inline hash-comment after a quoted value; (3) same with spaces-around-equals and trailing whitespace. In each shape the anchored regex fails to match the remote line, so last-match falls back to the earlier file: line -> ALLOW -> main() spawns npx drizzle-kit push while drizzle-kit dotenv resolves the REMOTE libsql URL. Binkley re-ran the SHIPPED resolveEffectiveUrl vs real dotenv 16.6.1 on the three shapes: all three BYPASS=true; control BYPASS=false. This is the F8/D7 loaded gun in the exact bad-merge scenario the fix docstring cites. Fix (Oliver): resolve via the SAME dotenv drizzle-kit uses, or model export/comment/whitespace; add a test per bypass shape.

### F-RG-2: push-guard.mjs gate is structurally blind to the F-BINK-2 change. MAJOR / NEEDS-SENIOR-REVIEW
Owner: Snorklewacker Refutation 2; confirmed by Binkley read (RG-19). push-guard.mjs line 18 sets TURSO_DATABASE_URL in process.env, driving db-push-dev.ts line 50 (processUrl-defined short-circuit) which returns BEFORE the .env.local matchAll branch (the entire F-BINK-2 change) executes. The gate never constructs a hostile .env.local and cannot observe any bypass. The fix passes its gate only because the gate exercises a different code path. Fix: the gate must exercise the .env.local resolution branch (unset process.env, feed a hostile .env.local).

### RG-A: .prettierignore omits .chuck/probes/ and .chuck/reports/ (gate hygiene). NIT / NEEDS-SENIOR-REVIEW
The check gate prettier scan reads untracked Binkley working artifacts the gate-running process itself writes, so re-running the gate self-contaminates to a false-red. .prettierignore excludes .chuck/session-state.md, .chuck/run.lock, .chuck/mode but not .chuck/probes/ or .chuck/reports/. Not a milestone-diff defect; a runner-hygiene fix.

### F-BINK-3: SQL injection via dump column names - VERIFIED FIXED.
Owner: Bobbi -> Snorklewacker Claim B (STANDS) + Binkley red-to-green (RG-9), false-positive (RG-6). Every column identifier routes through assertSafeIdentifier before interpolation (backup-prod.ts L212); no other unguarded SQL identifier path remains (RG-12). Red-to-green proven: removing the guard makes the hostile-column test fail; with the fix it throws unsafe SQL identifier, 0 rows land, tx rolls back. All 52 real columns pass the guard - no false-positive DoS today. LATENT (schema-evolution): guard forbids digits, so a future digit-bearing column would throw on a real restore.

### F-BINK-4: silent missing-dump restore - VERIFIED FIXED.
Owner: Ronald-Ann -> Snorklewacker Claim C (STANDS) + Binkley red-to-green (RG-10). restoreTables throws on a missing dump (L198). Red-to-green proven: reverting to silent counts[file]=0 continue makes the missing-dump test fail; with the fix it throws naming the table. Empty-array dump restores 0 without throwing (present-empty is not missing); superseded-only throws; corrupt JSON gives a distinct error; mid-loop throw rolls back prior inserts.

## Waiver / disposition confirmations (not findings)
- F-BINK-1 (Turso token) CLOSED by operator waiver. E3 Answer = WAIVED; DECISIONS D20 corrects A1; A1 corrected-by-reference. Chain consistent at HEAD (RG-3). NOT re-probed. DoD secrets-rotated satisfied-by-waiver for Turso.
- F-BINK-5 / F-BINK-7 dispositioned in DECISIONS D19 (operator-accepted). Present at HEAD.
- F-BINK-6 (PR 13 targets main) process note, orchestrator-handled; not a code defect.

## Coverage manifest, Binkley re-gate
Rule zero: Unexecuted = hypothesis. Anything assertable by a command was run (output quoted) or labeled UNVERIFIED.

### CHECKED
- 12 deterministic gates: run-gates.sh M0 (RG-4); committed-tree check green with artifacts aside (RG-5); M0.log.
- CI on exact HEAD sha: run 29371493553 headSha de0c8ba success completed (RG-2, RG-15; Kaylee-check).
- F-BINK-2 fix status: shipped resolveEffectiveUrl vs real dotenv 16.6.1 on 4 shapes (RG-18) - 3 bypasses + control. push-guard.mjs blindness by read (RG-19).
- F-BINK-2/3/4 real red-to-green: each fix reverted in isolation, test fails, restored via git checkout (RG-8/9/10); tree clean after (RG-11).
- F-BINK-3 completeness: all SQL interpolation paths guarded (RG-12); all 52 real columns pass (RG-6).
- Waiver record chain: E3 answered, D20, A1 correction, D19 (RG-3). prod-verify live re-run (RG-16); R4 tag (RG-17).
- Snorklewacker load-bearing findings (Claim A + gate blindness) spot-checked by independent Binkley re-execution - both reproduce (RG-18/19). Claims B/C corroborated by Binkley owner-verifier probes (RG-6/9/10).

### NOT CHECKED
- End-to-end db-push-dev main() spawning real drizzle-kit against a mutated real .env.local: deliberately not run (would mutate repo .env.local with commented prod creds, could contact production). Bypass proven at the exact decision boundary main() uses (isLocalFileUrl L79).
- dotenv shapes beyond the 4 tested: 3 bypasses suffice to fail; exhaustive dotenv-grammar sweep not run.
- Mutation-kill beyond the single-mutant red-to-green (RG-9/10): not exhaustively mutated.

### COULD NOT CHECK
- (none this cycle.)

## Remediation (FAIL -> Oliver, cycle 2, TDD)
Fix set: F-RG-1 (resolve the effective URL through the SAME dotenv drizzle-kit uses, or model export/inline-comment/whitespace, plus a test per bypass shape) and F-RG-2 (make push-guard.mjs exercise the .env.local branch, not the process.env short-circuit). RG-A (add .chuck/probes/ and .chuck/reports/ to .prettierignore) bundled in. F-BINK-3/4 stay fixed; F-BINK-1 stays waived. The remediation diff touches scripts/db-push-dev.ts, .chuck/probes/push-guard.mjs, tests, .prettierignore - inside the finding set, so cycle-3 re-gate stays scoped unless the diff spreads. End of cycle 2 (cycle 1 = original FAIL). Two more scoped cycles remain before the section-7 three-strike escalation line.

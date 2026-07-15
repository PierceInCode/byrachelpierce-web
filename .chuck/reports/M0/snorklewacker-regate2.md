# Snorklewacker re-gate cycle-3 (regate2) - M0 push-guard

Charge: REFUTE. Branch chuck/M0 @ HEAD dbc86383131996f7590412cdbf32bd14424aa20d.
Rule zero: Unexecuted = hypothesis. Every verdict is backed by a quoted executed probe or labeled UNVERIFIED.
All probes appended to .chuck/probes/M0-ledger.md. cwd for every probe: repo root.

Environment facts established by probe (load-bearing):
- Actual node runtime = v24.4.0 (env nominally Node 20).
- drizzle-kit installed = 0.31.10 (package.json pins caret-0.31.4, within range, not a freeze defect).
- Root dotenv = 16.6.1; NO dotenv-expand anywhere in the tree.
- drizzle.config.ts imports dotenv config which resolves to the repo dotenv 16.6.1, the SAME version the guard imports. drizzle-kit bin.cjs bundles dotenv 16.5.0 but only uses it to auto-load the DEFAULT .env (path.resolve cwd .env, bin.cjs lines 754 and 91606), override=false. .env.local is parsed ONLY by drizzle.config.ts via dotenv 16.6.1.

---

## 1. CLAIM 1 - guard is bypass-proof; resolved value byte-identical to what drizzle-kit targets; no .env.local shape can make the guard ALLOW while drizzle-kit targets remote.

Quoted (scripts/db-push-dev.ts lines 44-47): the guard parses .env.local with dotenv ITSELF, the exact parser drizzle-kit uses, making the guard view byte-identical to the URL drizzle-kit will actually target.

VERDICT: REFUTED.
True for the .env.local axis it defends, but false as stated: the guard premise omits an entire input file drizzle-kit reads and the guard does not, a plain .env.

Attack P4 (REAL drizzle-kit runtime, hermetic repo subdir): .env=libsql://from-plain-dotenv.invalid and .env.local=file:./dev.db, then real drizzle-kit push via node node_modules/drizzle-kit/bin.cjs push --config drizzle.config.ts (a printing stub config that throws before any DB connect):

    --- drizzle-kit exit: 1 ---
    STDOUT
    Reading config file [ _scratch_driztest / drizzle.config.ts ]
    RESOLVED_TURSO_URL = libsql://from-plain-dotenv.invalid
    STDERR
    STOP_BEFORE_DB_CONNECT

Swap control (.env=file:, .env.local=remote): RESOLVED_TURSO_URL = file:./dev.db.

So .env ALWAYS wins over .env.local at push time (dotenv override=false, .env loaded first by bin.cjs). The guard readEnvLocal reads ONLY .env.local, so with .env.local=file: it resolves file:, isLocalFileUrl true, ALLOW, spawns npx drizzle-kit push, which targets the REMOTE .env value. That is the forbidden state: guard ALLOWs while drizzle-kit pushes to a remote DB. The docstring claim byte-identical to the URL drizzle-kit will actually target is false whenever a sibling .env defines TURSO_DATABASE_URL.

Attacks that STAND (did NOT break it):
- P2: 18 hostile .env.local shapes (export-prefix, inline-comment-after-quoted, ws-around-equals, duplicate-key last-wins, BOM, CRLF, single-quote, multiline, literal backslash-n, dollar-brace expansion attempts, comment-cloak): guard dotenv.parse vs drizzle dotenv.config agreed on value 16/18; the 2 mismatches (empty, whitespace-only) fail CLOSED (guard undefined, REFUSE). 0 bypasses on the .env.local axis. The cycle-3 regex to dotenv.parse fix genuinely closed the earlier F-BINK-2 .env.local bypass (ledger 270-297).
- P3: process.env short-circuit vs drizzle override=false, 8 scenarios incl process.env REMOTE + .env.local FILE: agreed on value every time. 0 bypasses.

Severity/exploitability: requires a developer to have a .env (not .env.local) with a remote TURSO_DATABASE_URL. .env is gitignored and not currently present, BUT it is the most common dotenv filename and drizzle.config.ts line 9 literally instructs npx drizzle-kit push. Same bad-merge / half-reverted-edit hazard class the guard claims to defend, via a file the guard never inspects. NEEDS-SENIOR-REVIEW: the fix and its probe both assert byte-identical fidelity while modeling only one of the two env sources drizzle-kit reads.

Remediation direction (not implemented): the guard should resolve via the SAME layered load drizzle-kit performs (.env then .env.local, override=false) instead of parsing .env.local alone; and/or refuse if any .env or .env.* sibling defines a non-file: TURSO_DATABASE_URL.

---

## 2. CLAIM 2 - push-guard.mjs truly gates: hostile shapes BLOCK, file: ALLOWs, prints PUSH-GUARD OK or non-zero on failure; deleting TURSO_DATABASE_URL forces the parse branch; robust verdict parse; a tsx crash is not misread as pass.

VERDICT: STANDS for what it tests; the claim OVERREACHES as a whole-guard gate (NEEDS-SENIOR-REVIEW).

Mutation testing, the probe DOES catch real breakage:
- P5 mutation A (isLocalFileUrl to always true, allow-everything): probe RED, PUSH-GUARD FAIL, refusal token DB PUSH REFUSED absent (exit 1).
- P6 mutation B (resolveEffectiveUrl to naive FIRST-match regex = the F-RG-1 bug): probe RED, all four hostile cases flipped ALLOW want BLOCK (exit 1). Proves check 4 genuinely exercises the fixed .env.local parse path.
Both mutations restored; git status --porcelain of the guard empty after each.

Sub-attacks that STAND (probe robust):
- Deleting TURSO_DATABASE_URL forces the parse branch: YES, mutation B affects only the parse branch and flipped the verdicts.
- Verdict-parse robustness (P7): child stdout is a lone verdict line ALLOW; the Node DEP0190 deprecation warning went to STDERR not stdout, so the stdout pop cannot be corrupted by a trailing warning.
- Crash-as-pass (P8): top-level throw then npx tsx exit 1; syntax error then exit 1. (An unresolvable absolute import specifier returns exit 0, but tsx resolves it away rather than crashing, irrelevant, since the probe imports the REAL resolvable guard module.) Realistic broken-guard modes yield non-zero exit, caught by the status check; a guard that loads but prints nothing yields empty verdict, caught by the verdict-mismatch branch.

Where the claim overreaches (P9): the probe references ONLY .env.local; it never creates a sibling .env and never invokes real drizzle-kit resolution (its comment at push-guard.mjs lines 15-16 says it tests the exact dotenv path drizzle-kit uses, but that is only the .env.local path). Therefore the probe prints PUSH-GUARD OK while the CLAIM 1 .env-precedence bypass is live, GREEN while a genuine bypass exists. The probe faithfully gates .env.local-parse fidelity; it does NOT gate guard-vs-real-drizzle completeness, which is what the M0 disarm (F8/D7) needs. NEEDS-SENIOR-REVIEW.

---

## 3. CLAIM 3 - drizzle.config / npm scripts leave no OTHER unguarded path to drizzle-kit push at a remote DB.

VERDICT: REFUTED (as an absolute); the script/CI surface is clean, but the raw binary route remains and is actively advertised.

Attack P10:
    git diff 33f9f4f..dbc8638 -- package.json:
      minus  db:push       to  drizzle-kit push        [REMOVED]
      plus   db:push:dev   to  tsx scripts/db-push-dev.ts
    grep push package.json -> only line 16 db:push:dev
    lifecycle hooks (pre/post/install/prepare) -> none
    Makefile / Taskfile / justfile / turbo.json -> none present
    .github/workflows/ci.yml -> TURSO_DATABASE_URL: file:./ci.db; runs seed-ci/build/e2e; NO push
    repo-wide grep drizzle-kit push (excl node_modules) -> only db-push-dev.ts + doc comments

The unguarded npm script was removed; no bare db:push, no lifecycle hook, no other task-runner, and CI never pushes (points at a file: DB). BUT the claim says no OTHER unguarded path, and two remain:
1. npx drizzle-kit push is directly runnable. drizzle-kit is an installed binary; the guard only intercepts the db:push:dev npm route, not the CLI. Removing the script does not remove the binary. This is the route CLAIM 1 bypass rides.
2. drizzle.config.ts line 9 comment: npx drizzle-kit push, Push schema changes to the database. Stale guidance pointing developers around the guard (iron rule 8 blocks me editing docs; flagged for the operator).

Severity: a developer-types-the-raw-command bypass, not a script/CI bypass. Real given the config comment advertises it. NEEDS-SENIOR-REVIEW (couples with CLAIM 1: raw route + a .env remote = silent prod push).

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis. Anything assertable by running a command was run (output quoted above and in the ledger) or labeled UNVERIFIED.

CHECKED
- CLAIM 1 .env.local-axis fidelity, P2 (18 shapes) + P3 (8 short-circuit scenarios): 0 bypasses; guard equals drizzle. STANDS on this axis.
- CLAIM 1 sibling-.env precedence, P4 real drizzle-kit push resolved to the remote .env value while the guard reads only .env.local: REFUTED.
- CLAIM 1 env-loader model, P1: both sides use dotenv 16.6.1 on .env.local; drizzle-kit auto-loads .env via bundled 16.5.0, override=false, .env first.
- CLAIM 2 gate efficacy, P5/P6 mutations A (allow-all) and B (naive-regex F-RG-1) both drive the probe RED.
- CLAIM 2 verdict parse, P7: warnings land on stderr; stdout is a lone verdict; pop correct.
- CLAIM 2 crash handling, P8: throw / syntax-error then tsx exit 1.
- CLAIM 2 coverage gap, P9: probe ignores .env; GREEN while the P4 bypass is live.
- CLAIM 3 script/CI surface, P10: unguarded db:push removed; no hooks/task-runners; CI uses file: DB and never pushes; raw npx drizzle-kit push + config line 9 stale guidance remain.
- Integrity, real push-guard.mjs = PUSH-GUARD OK (exit 0) on pristine guard; git status of guard/probe/pkg/config empty; HEAD dbc8638.

NOT CHECKED (debt, not clearance)
- The guard main SUCCESS path (actually spawning drizzle-kit push against a real file: dev.db): not exercised; I tested the decision logic (resolveEffectiveUrl / isLocalFileUrl), the REFUSAL path (probe), and real drizzle-kit URL resolution (P4). The spawn-on-success is a thin spawn of npx drizzle-kit push and outside the three claims scope.
- .env.production, .env.local.*, .env.development precedence in drizzle-kit load order: I proved .env beats .env.local; other variants not enumerated (bin auto-loads only .env by default, lower risk, unverified).
- F-BINK-1 (Turso token): out of scope per operator waiver E3/D20.

COULD NOT CHECK (reproducible gaps)
- None. Two probe iterations initially failed on shell/heredoc escaping (node_modules resolution from the scratchpad dir; backslash collapse through bash to Python); both resolved by writing probes into the repo tree and building path/newline literals via String.fromCharCode / join. No claim was left dark for lack of a working command.

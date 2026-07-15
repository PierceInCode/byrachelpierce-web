# Snorklewacker re-gate cycle 4 (regate3) - SCOPED F-RG-3 re-gate

- HEAD dede7b6b450323efaa5d9616a60aff2bd4c725d8 (== chuck/M0), merge-base 33f9f4f, milestone M0.
- cwd for every probe = repo root C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web.
- Env: node v24.4.0 (env nominally Node 20); drizzle-kit 0.31.10 installed (bundles dotenv 16.5.0 INLINE in bin.cjs, no nested package); repo dotenv 16.6.1 (guard AND drizzle.config.ts both use this one).
- Charge: REFUTE. Scratch harness lived under .chuck/_snork_regate3/ and was removed after the run; the shipped guard was restored to pristine after every mutation (git-diff of the guard empty; confirmed).
- I did NOT trust the cycle-4 Binkley RG4 summaries or the brief env facts - I re-read the shipped bin.cjs and drove REAL drizzle-kit push (stopped before DB connect) myself.

## VERDICT: CLAIM A REFUTED | CLAIM B STANDS | CLAIM C STANDS (with a NEEDS-SENIOR-REVIEW coverage hole)

---

## Refutation 1 - CLAIM A: REFUTED (live prod-write bypass via case-variant .env key on Windows)

Claim (quoted): the db:push guard now replicates drizzle-kit push env resolution COMPLETELY; its resolved effective URL is byte-identical to what real drizzle-kit push targets across ALL .env / .env.local combinations (remote-in-.env, file-in-.env.local, empty-value, key-presence-vs-value, commented, export-prefix, duplicate-key); find ANY combination where the guard resolves a file: URL (ALLOW) while real drizzle-kit would target a non-file URL - that is a live prod-write bypass.

Attack. Hermetic harness (.chuck/_snork_regate3/harness2-real.mjs + scenarios2.mjs + compare2.mjs): per scenario, write .env/.env.local into a fresh dir INSIDE the repo tree, run REAL drizzle-kit via node node_modules/drizzle-kit/bin.cjs push --config STUB. The stub mirrors drizzle.config.ts line 38 (loads .env.local via dotenv, override=false) then reads process.env.TURSO_DATABASE_URL exactly as line 53, prints the resolved URL, and throws BEFORE any DB connect. TURSO_DATABASE_URL is deleted from the child env. The guard side runs the SHIPPED resolveLayeredUrl on byte-identical bodies (absent file == empty string, matching readSibling). Case-variant TURSO_DATABASE_URL key in .env, .env.local holding the safe file:, no process var:

    K01-env-mixedcase-Turso
      real ="libsql://prod.invalid" (BLOCK)  guard="file:./dev.db" (ALLOW)  <<VALUE-MISMATCH>>  <<<<< BYPASS >>>>>
    K03-env-lower-with-export
      real ="libsql://prod.invalid" (BLOCK)  guard="file:./dev.db" (ALLOW)  <<VALUE-MISMATCH>>  <<<<< BYPASS >>>>>
    K04-env-lower-dup-then-upper-file
      real ="libsql://prod.invalid" (BLOCK)  guard="file:./dev.db" (ALLOW)  <<VALUE-MISMATCH>>  <<<<< BYPASS >>>>>
    K02-env-allcaps-ok-control
      real ="libsql://prod.invalid" (BLOCK)  guard="libsql://prod.invalid" (BLOCK)
    K05-env-upper-file-then-lower-remote
      real ="file:./dev.db" (ALLOW)  guard="file:./dev.db" (ALLOW)
    K06-env-trailingspace-key
      real ="libsql://prod.invalid" (BLOCK)  guard="libsql://prod.invalid" (BLOCK)
    SUMMARY2: n=6 bypasses=3 value_mismatch=3

Same bypass in the first 17-shape batch as T17-env-key-lower-nomatch (.env = turso_database_url=<remote>, .env.local = TURSO_DATABASE_URL=file:./dev.db):
    real ="libsql://prod.invalid" (BLOCK)  guard="file:./dev.db" (ALLOW)  <<<<< BYPASS >>>>>

Mechanism isolated (.chuck/_snork_regate3/caseprobe.mjs, run inside the repo):

    platform: win32
    dotenv parsed keys: ["turso_database_url"]
    process.env.TURSO_DATABASE_URL (uppercase read): "libsql://prod.invalid"
    process.env.turso_database_url (lowercase read): "libsql://prod.invalid"

Guard-side isolation (.chuck/_snork_regate3/t17-isolate.mts, shipped helpers):

    LOWERCASE .env key (T17): guard resolveLayeredUrl="file:./dev.db" -> ALLOW
    UPPERCASE .env key (control): guard resolveLayeredUrl="libsql://prod.invalid" -> BLOCK

Verdict: REFUTED. Root cause: the guard definesUrl (db-push-dev.ts lines 32-34) decides precedence with a CASE-SENSITIVE hasOwnProperty check for the exact key TURSO_DATABASE_URL on the dotenv-parsed object. Real drizzle-kit push reads the effective URL via process.env.TURSO_DATABASE_URL (drizzle.config.ts line 53), and on win32 process.env is CASE-INSENSITIVE. So a .env line with a case-variant key (turso_database_url, Turso_Database_Url, export turso_database_url) is invisible to the guard, which falls through to the file: in .env.local and returns ALLOW (exec-ing drizzle-kit push), while real drizzle-kit populates process.env and resolves the REMOTE - pushing an unreviewed schema diff at that remote (Iron Rule 1: production DB is live). NOT byte-identical across ALL combinations; the fix central invariant is false.

Scope/severity:
- Windows-specific, and Windows 11 is the SOLE sanctioned dev environment (CLAUDE.md: Environment Windows 11, Node 20). On POSIX process.env is case-sensitive, so the uppercase read is undefined and real drizzle falls to .env.local file: - no divergence there. The bypass exists precisely where the project runs.
- Reachability is the SAME class the fix itself targets: F-RG-3 (the uppercase sibling-.env case) was treated as a genuine prod-write defect worth three cycles despite needing a locally-created/bad-merged .env; this case-variant is the identical reachability class and is NOT currently on disk (only .env.local exists) - but the claim asserts COMPLETENESS, and completeness is refuted.

NEEDS-SENIOR-REVIEW: the fix must normalize key case in definesUrl/resolveLayeredUrl (or resolve .env the way Windows process.env actually surfaces it) to be sound on the target OS.

---

## Refutation 2 - CLAIM B: STANDS (best attack failed; complete auto-load set is {.env, .env.local})

Claim (quoted): the COMPLETE set of env files drizzle-kit push auto-loads in THIS project is exactly { a plain .env, and .env.local } and NOTHING ELSE; prove drizzle-kit ALSO auto-loads some env file the guard never inspects (.env.development[.local], .env.production[.local], a NODE_ENV cascade, .env.vault, dotenv-expand of VAR refs, or any other).

Attack (executed, .chuck/_snork_regate3/claimB-extrafiles.mjs). Place .env=file: alongside each candidate extra file holding a REMOTE URL, across NODE_ENV values, run REAL drizzle-kit; if the remote wins, that file is auto-loaded and unmodelled.

    B-a-dotproduction (NODE_ENV=production) -> resolved="file:./dev.db"  (ignored, file: won)
    B-b-dotproduction-local (NODE_ENV=production) -> resolved="file:./dev.db"  (ignored, file: won)
    B-c-dotdevelopment (NODE_ENV=development) -> resolved="file:./dev.db"  (ignored, file: won)
    B-d-dotdevelopment-local (NODE_ENV=unset) -> resolved="file:./dev.db"  (ignored, file: won)
    B-e-vault-no-key (NODE_ENV=production) -> resolved="file:./dev.db"  (ignored, file: won)
    B-f-nodeenv-test-cascade (NODE_ENV=test) -> resolved="file:./dev.db"  (ignored, file: won)
    B-g-local-remote-but-envfile-file (NODE_ENV=unset) -> resolved="file:./dev.db"  (ignored, file: won)
    CLAIM-B SUMMARY: extra-source leaks=0 (0 => only {.env,.env.local} auto-loaded)

VAR-expansion axis (.chuck/_snork_regate3/expand-probe.mjs): real drizzle-kit resolved the LITERAL libsql://DOLLAR-HOST (no dotenv-expand); guard resolved the same literal - match, both non-file BLOCK.

Direct read of shipped node_modules/drizzle-kit/bin.cjs (did not trust the brief):
- 91604-91613: bundled dotenv/config IIFE - config(Object.assign({}, env-options, cli-options(process.argv))).
- 882-903 env-options: only DOTENV_CONFIG_ENCODING/PATH/DEBUG/OVERRIDE/DOTENV_KEY honored. 906-917 cli-options: only dotenv_config_(...)= argv.
- 753-798 configDotenv: default single path resolve(cwd, .env); override only from options. 799-808 config: .env.vault / _configVault reached ONLY when _dotenvKey() is non-empty, i.e. DOTENV_KEY option or process.env.DOTENV_KEY set (neither is). NODE_ENV: 0 grep hits in bin.cjs.
- 837-860 populate: override=false sets a key only if NOT already present - later loads cannot clobber; .env (bin, first) wins over .env.local (config, second).

Verdict: STANDS. Complete auto-load set is exactly { .env (bin default, override=false), .env.local (drizzle.config.ts line 38, override=false) }. .env.vault / DOTENV_KEY / DOTENV_CONFIG_PATH / dotenv_config_path= can redirect only out-of-band via an env var or argv - the same class as the already-accepted F-RG-4. resolveLayeredUrl models exactly these two files. Nuance: the CLAIM-A refutation is NOT a CLAIM-B violation - no NEW file is auto-loaded; .env itself contributes a case-variant key the guard mis-models.

---

## Refutation 3 - CLAIM C: STANDS for the named mutation, with a NEEDS-SENIOR-REVIEW coverage hole

Claim (quoted): the push-guard.mjs gate probe (check 5, the .env-layering axis) genuinely GATES this class - a guard that reverts to reading only .env.local drives the probe RED; find a broken-guard state the probe still passes GREEN.

Attack. Pristine probe, then mutation revert-ignore-env (.chuck/_snork_regate3/mutate.py) makes resolveLayeredUrl ignore .env and read only .env.local (the exact cycle-3 blind spot), then restore.

Pristine: node .chuck/probes/push-guard.mjs -> PUSH-GUARD OK (exit 0). Mutated:

    .env-layering [.env=remote + .env.local=file: (.env wins -> BLOCK)] -> ALLOW (want BLOCK)
    .env-layering [.env=file: + .env.local=remote (.env wins -> ALLOW)] -> BLOCK (want ALLOW)
    PUSH-GUARD FAIL:
    - .env-layering mis-resolved ".env=remote + .env.local=file:": got ALLOW, want BLOCK
    - .env-layering mis-resolved ".env=file: + .env.local=remote": got BLOCK, want ALLOW
    PROBE_EXIT=1

Restored via git-restore of the guard file; the git-diff of the guard is empty afterward (tree pristine).

Verdict: STANDS - the probe drives RED (exit 1) on the named revert, catching the exact ".env=remote + .env.local=file:" prod-write bypass. The probe genuinely gates the uppercase-key .env-layering class.

NEEDS-SENIOR-REVIEW (coverage hole, not a refutation of the named mutation): every .env-layering case in push-guard.mjs (lines 138-163) uses only an uppercase TURSO_DATABASE_URL= key. So the probe passes GREEN while the Refutation-1 case-variant bypass (T17/K01/K03/K04) is LIVE - a broken-real-guard state the probe cannot observe. Same "gate structurally blind to a live bypass" pattern that FAILED cycles 2 and 3, re-appearing on the case-folding axis. The gate should add a lowercase/mixed-case .env key case to close its own blind spot alongside the CLAIM-A fix.

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

### CHECKED
- CLAIM A byte-identity across .env/.env.local combinations - harness.mjs + guard-eval.mts + compare.mjs (20 combos, real drizzle-kit vs shipped guard): 0 bypass on all-uppercase shapes; then harness2-real.mjs + scenarios2.mjs + compare2.mjs (case-variant batch): 3 BYPASSES (K01/K03/K04) + T17. Mechanism isolated by caseprobe.mjs (win32 case-insensitive process.env) and t17-isolate.mts (guard LOWER->ALLOW vs UPPER->BLOCK). REFUTED. Raw output quoted above.
- CLAIM A empty/whitespace/commented/export/quoted/dup/CRLF/tab/single-quote axes - 20-combo compare, all MATCH (ledger SW-P3). No bypass.
- CLAIM A VAR-expansion axis - expand-probe.mjs/expand-guard.mts: real and guard both literal, match. No bypass.
- CLAIM B complete auto-load set - claimB-extrafiles.mjs (7 extra-file/NODE_ENV combos, real drizzle-kit): extra-source leaks=0; plus direct read of shipped bin.cjs (IIFE 91604-91613, env/cli-options 882-917, configDotenv 753-798, vault gate 799-808, populate 837-860). STANDS. Output quoted.
- CLAIM C probe gates the named revert - pristine push-guard.mjs GREEN; revert-ignore-env mutation -> RED exit 1 (two layered cases flip); restored, diff empty. STANDS. Output quoted.
- CLAIM C coverage hole - read push-guard.mjs 138-163 (all layered cases uppercase-key); pristine probe GREEN coexists with the executed Refutation-1 live bypass. NEEDS-SENIOR-REVIEW.
- Env facts - drizzle-kit 0.31.10 / bundled dotenv 16.5.0 inline / repo dotenv 16.6.1; only .env.local present on disk, all .env* gitignored.
- Repo integrity - status of scripts/ tests/ empty after all mutations; guard byte-identical to HEAD.

### NOT CHECKED
- Non-Windows (POSIX) behavior of the CLAIM-A bypass - reasoned (POSIX process.env case-sensitive => uppercase read undefined => real falls to .env.local file: => no divergence), NOT executed (no Linux/macOS runner this session). Makes the finding Windows-scoped; does not weaken it (Windows is the sanctioned platform). A debt, not a clearance.
- The 12-gate deterministic suite / CI-green / prod-verify / alias-smoke - out of this SCOPED F-RG-3-only re-gate; covered by Binkley RG4-1 earlier this cycle. Not re-run here.
- F-RG-4 (raw npx drizzle-kit push) and F-BINK-1 (Turso token) - per brief, dispositioned/waived; not probed.

### COULD NOT CHECK
- Shipped main() end-to-end against a hermetic .env for the T17 case - main() readSibling reads ../.env relative to the SCRIPT location, not cwd, so aiming it at a hermetic .env would require writing a real .env next to the script (mutating the repo working tree, which I refused). Substituted with two executed proofs that jointly establish the bypass without touching the repo: (a) shipped resolveLayeredUrl/isLocalFileUrl on the exact bytes -> ALLOW (t17-isolate.mts), and (b) real drizzle-kit resolving the remote for the same file pair (harness2-real.mts T17/K0x). No command errored; deliberate scope choice to avoid working-tree mutation, recorded for reproducibility.

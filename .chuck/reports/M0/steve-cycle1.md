# Steve Dallas -- M0 security & compliance review (cycle 1)

**Rule zero: Unexecuted = hypothesis.** Every finding below of severity IMPORTANT or higher is backed by a command I ran myself, quoted verbatim, in this session. Anything not independently re-executed is labeled UNVERIFIED. Settled postures (branch protection unavailable on this GitHub plan -- Invariant 2 / DECISIONS D4) are confirmed by citation, not re-probed.

PINS: HEAD acd4bbd24fa5600978bd280f34cd58f75cff5004 = chuck/M0. Base 33f9f4f91474093162e5b799767c2939d60283a6. Diff-hash 733832265081d7b6a643ac8407d76b0930f2853a (matches ledger row #2, re-verified via git diff --stat against the same range).

---

## 1. Dependency CVE -- drizzle-orm bump (VERIFIED)

Ran both audit commands myself:

[CODE]$ npm audit --omit=dev --audit-level=high

# npm audit report

next-auth <=0.0.0-pr.11562.ed0fce23 || >=4.11.0
Severity: moderate
NextAuthjs Email misdelivery Vulnerability - GHSA-5jpx-9hw9-2fx4
...
postcss <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - GHSA-qx2v-qp2m-jg93
...
3 moderate severity vulnerabilities
EXIT:0
[/CODE]
npm audit --omit=dev --json parsed: metadata.vulnerabilities: {"info":0,"low":0,"moderate":3,"high":0,"critical":0,"total":3}. This is a genuine below-threshold pass, not a suppressed high -- the JSON metadata itself carries zero high/critical, so --audit-level=high exiting 0 is honest, not a filter artifact. Note npm audit --omit=dev with no level flag exits 1 (npm's default threshold is "low"); only the gate's actual command (--audit-level=high) is the contract, and that one is rc=0 as required.

drizzle-orm advisory GHSA-gpj5-g38j-94v9 (CVE-2026-39356, SQL injection via unescaped identifier quoting) does not appear anywhere in the audit output at all -- fully resolved, not merely filtered. Cross-checked independently against the GitHub Advisory API (api.github.com/advisories/GHSA-gpj5-g38j-94v9): severity: high, vulnerable_version_range: "< 0.45.2", first_patched_version: "0.45.2". Lockfile resolves drizzle-orm to exactly 0.45.2 (package-lock.json line 15, confirmed by direct read of lock.packages['node_modules/drizzle-orm'].version = 0.45.2). The bump lands exactly on the patched version, not adjacent to it.

next-auth pin confirmed held at exactly 5.0.0-beta.25 in both package.json line 30 and the lockfile-resolved version (lock.packages['node_modules/next-auth'].version = 5.0.0-beta.25) -- Invariant 6 holds. npm audit's own suggested remediation (npm audit fix --force -> next-auth@5.0.0-beta.31) was correctly NOT applied; applying it would have been an unauthorized bump/escalation.

Verdict: CONFIRMED CLEAN. No finding.

## 2. License sweep of production dependency tree (VERIFIED -- one finding)

Method: npm ls --omit=dev --all --json enumerated the full production tree (232 unique name@version entries including transitive). For each, read the license field directly from the installed package's own node_modules/<name>/package.json (no license-checker dependency added, per D10's "Steve's one-time review suffices" rationale). Cross-referenced each installed path against disk (fs.existsSync) to separate genuinely-installed packages from npm ls --all's inclusion of foreign-platform optional variants and unused driver peers that drizzle-orm/next-auth declare but this project never installs.

Result: 137 of 232 listed entries are actually present on disk; 95 are phantom (sharp/next/tailwindcss-oxide/lightningcss platform binaries for other OSes, plus unused DB-driver peers -- Postgres/MySQL/Prisma/Cloudflare/AWS/etc. -- that drizzle-orm supports optionally but this codebase never imports). Of the 137 real installs, license breakdown:

[CODE]
MIT: 100, ISC: 11, Apache-2.0: 13, BSD-2-Clause: 6, BSD-3-Clause: 2,
0BSD: 1, MPL-2.0: 2 (lightningcss + lightningcss-win32-x64-msvc),
CC-BY-4.0: 1 (caniuse-lite)
[/CODE]

FINDING (MODERATE, NEEDS-SENIOR-REVIEW): two installed transitive packages fall outside the D10 permissive allowlist (MIT/Apache-2.0/BSD/ISC):

- lightningcss@1.31.1 and platform binary lightningcss-win32-x64-msvc@1.31.1 -- license MPL-2.0 (file-level copyleft). Path: @tailwindcss/postcss -> @tailwindcss/node -> lightningcss (npm ls lightningcss --omit=dev confirmed this exact chain).
- caniuse-lite@1.0.30001800 -- license CC-BY-4.0 (a data/attribution license, not software copyleft). Path: next -> caniuse-lite.

Mitigating facts I verified, not just asserted: both are Tailwind/Next build-time tooling (a CSS transpiler and a browserslist data table used at next build), not code imported or executed by application source -- grep -rn "lightningcss|caniuse-lite" across the repo (excluding node_modules) returned zero hits outside package-lock.json and this diff's own text. Neither ships as invoked logic inside the deployed serverless/runtime bundle in the way application code does. MPL-2.0 is file-level copyleft (not viral to the whole work) and does not attach obligations to code that merely uses the compiler's output; CC-BY-4.0 is an attribution-only data license, materially lower risk than a software copyleft.

This is a genuine gap against D10's literal wording ("the production dependency tree must be permissive-licensed") -- the tree as npm ls --omit=dev resolves it does include these two, and the plan's allowlist does not carve out a build-time-tool exception. I am not the deciding authority on whether "production dependency tree" was intended to mean "ships in the runtime bundle" vs. "everything npm ls --omit=dev prints" -- that is a genuine license-scope reading question for the operator/legal, not one I can resolve by running another command. Flagged NEEDS-SENIOR-REVIEW, not blocking on my say-so.

## 3. Secret hygiene (VERIFIED CLEAN)

Ran the project's own M4 secret-sweep gate against current history (available now, not just at M4):
[CODE]
$ node .chuck/probes/secret-sweep.mjs
history lines scanned: 65381
SWEEP CLEAN
EXIT:0
[/CODE]

Grepped the full milestone diff (5291 lines) for credential shapes (PEM blocks, AWS/Google/GitHub/Slack/Resend key prefixes, libsql:// URLs, JWT-shaped strings, sk_live_, inline password assignments). One pattern class matched (libsql://) -- inspected every hit with context: all are test fixtures (libsql://push-guard-probe.invalid, libsql://from-process.invalid, libsql://prod.example.turso.io in test/doc prose) or narrative text describing the F8 finding. Zero real credential shapes found in the diff.

Traced credential-reading code in both new scripts:

- .chuck/probes/prod-verify.mjs line 12-13: regex anchored to commented (hash-prefixed) TURSO_DATABASE_URL / TURSO_AUTH_TOKEN lines only. Ran it live myself against production (D8-sanctioned): output was "migrations tracked: 4" / "dimension columns present: true" / "paintings: 528" / "trail_completions rows: 1" / "sentinel rows: 0" / "PROD-VERIFY OK" -- no URL or token value printed anywhere in raw stdout.
- scripts/backup-prod.ts readProdCreds() (lines 218-230): same commented-line-only regex pattern. Its only console.log (line 238) emits event/date/counts/out -- never url/token. Its catch-all error path (line 248) logs err.message, a low-severity theoretical concern if the libsql HTTP client ever embedded a bearer token in a thrown error string -- I did not find evidence this occurs in this client library, and it is a generic-library-behavior question, not a defect in this diff's authored code. Noted, not raised to a finding: speculative, not diff-attributable, and NOT independently probed further (no realistic way to force that error path without touching production in a way D8 doesn't sanction).

Tracked-file check: "git ls-files | grep -i env|token|lnk" returned only next-env.d.ts (an ambient TS declaration, not a credential). A diff-stat scoped to .env*, Database Token.txt, and .lnk paths returned empty -- the diff touches none of these paths. Database Token.txt does not exist on disk (ls -> "No such file or directory"), consistent with the operator's A1 claim. .gitignore covers .env* (blanket line 59, added this milestone, on top of the pre-existing specific .env/.env.local/.env.production/.env.*.local lines) and byrachelpierce-web.lnk (line 60, per D12).

Verdict: CONFIRMED CLEAN. No finding.

## 4. Auth-path / privileged-action trace (VERIFIED)

M0 has no new user-facing auth route; the closest privileged action is the db:push disarm (D7) -- a script capable of writing schema to whatever DB the environment points at. Traced scripts/db-push-dev.ts main() (line 64): resolves effective URL via resolveEffectiveUrl() (line 65) -> gates on isLocalFileUrl() (line 67) -> only on pass reaches spawn('npx', ['drizzle-kit', 'push'], ...) (line 77). There is no code path that reaches the spawn call without first clearing the local-file-only check; the guard sits strictly between entry and the privileged action.

Re-ran the gate myself (not just cited the ledger):
[CODE]
$ node .chuck/probes/push-guard.mjs
db:push:dev vs libsql:// URL -> exit 1
PUSH-GUARD OK
(node:54916) [DEP0190] DeprecationWarning: Passing args to a child process with shell
option true can lead to security vulnerabilities, as the arguments are not escaped...
EXIT:0
[/CODE]
Confirmed package.json has db:push:dev (line 16) and no bare db:push script (grep for "db:push shows one hit, db:push:dev only).

Checked the DEP0190 warning is not live risk: the only spawn call in scripts/db-push-dev.ts uses hardcoded literal args ('npx', ['drizzle-kit', 'push']) -- no variable interpolation, no untrusted input reaches the shell despite shell:true on Windows. Confirmed benign, not a finding.

Also checked scripts/backup-prod.ts's table-name-to-SQL interpolation (SELECT * FROM the quoted identifier, line 142) against the exact vulnerability class the drizzle-orm CVE just fixed (unescaped identifier quoting): assertSafeIdentifier() (line 72) allowlists letters and underscores only before interpolation, and the only inputs ever passed are the 10 hardcoded entries in the BACKUP_TABLES constant (lines 84-95) -- no runtime/attacker-controlled data reaches this path. Not vulnerable to the CVE-2026-39356 class in practice (the GHSA's own stated precondition -- attacker-controlled input passed to identifier construction -- does not hold here).

Verdict: CONFIRMED CLEAN. No finding.

## 5. Rotation posture per Amendment A1 (VERIFIED consistent)

Cross-read D18/A1, ESCALATIONS E2, and .chuck/gates.json's M0 gate list (12 gates) against each other:

- .chuck/gates.json M0 gate array: 12 entries, confirmed by direct read -- rotation-recorded is absent (matches A1 item 1 and ledger row #3).
- BUILD-SPEC.md M0 work item 9 and the acceptance-gates table (lines 42-80, read directly) still show the OLD 7-gate list including rotation-recorded -- this is the frozen spec text A1 explicitly says is "amended by reference -- not edited in place" (A1 item 2). The mismatch between the frozen spec table and the live gate file is BY DESIGN per A1's own wording, not a drift defect.
- ESCALATIONS E2's Answer (dated 2026-07-14) states the rotation is DONE (not waived): new Resend key + new Turso token created, old ones invalidated, Database Token.txt deleted, backup confirmed. I independently confirmed Database Token.txt absent from disk and absent from git tracking (see section 3) -- consistent with the claim on the one sub-item a repo-state probe can actually check.
- HT1 4/7 status (magic-link send-test and Vercel-preview confirmation deferred to M3/ship-report) is explicitly not gated at M0 per A1 -- I did not demand HT1-result.md or the retired gate, per the brief's own instruction and A1's own text.

Verdict: internally consistent. No finding. (I have no independent way to verify the Resend/Turso credentials were ACTUALLY rotated at the provider side -- that is an operator attestation I cannot probe from this repo; it is correctly not gated here and is out of my lane per the assignment.)

## 6. Other coverage swept (no diff-relevant surface found)

- COPPA / store privacy / child-directed data collection: grepped the full diff for COPPA/child/parental/behavioral-ad/device/firmware/IoT terms -- zero hits. This milestone (infra/hygiene/CVE/rotation) introduces no data-collection surface, no device code, and the underlying site (per Architecture) is a general-audience local-business/mural-trail site, not child-directed. NOT CHECKED beyond this diff -- out of scope for M0; would apply to a future milestone that touches data collection.
- IoT device security: not applicable -- this project ships no device.
- New-dependency drift: the package.json diff shows only drizzle-orm's version bump, the db:push to db:push:dev script rename, removal of a duplicate @tailwindcss/postcss devDependency line, and the advisory engines field. No new package name introduced; the two M1-pre-approved additions (@vercel/analytics, @lhci/cli) do not appear in this diff. Dependency freeze (Invariant 7) holds.
- Dedupe (work item 8, other half): confirmed via lockfile read -- only one node_modules/@tailwindcss/postcss entry remains (4.2.1), duplicate ^4.0.0 devDependency gone.
- EOL renormalization (item 4) re-checked independently: node .chuck/probes/eol-check.mjs returned "files with CRLF working-tree endings: 0" / "EOL OK", exit 0. No secret-adjacent risk in this change (pure line-ending normalization).
- Branch protection: settled per DECISIONS D4 / Invariant 2 -- "branch protection unavailable on this GitHub plan; PR-only discipline substitutes." Not re-probed; a 403/absence here would only confirm the recorded contract, not surface a new gap. Citing, not re-deriving.

---

## Findings summary

Finding 1 -- MODERATE -- NEEDS-SENIOR-REVIEW: lightningcss / lightningcss-win32-x64-msvc (MPL-2.0) and caniuse-lite (CC-BY-4.0) are installed in the --omit=dev tree, outside D10's MIT/Apache-2.0/BSD/ISC allowlist. Both are build-time-only tooling (Tailwind CSS compiler, Next browserslist data), confirmed absent from application source via repo-wide grep. Genuine gap against the allowlist's literal wording; risk profile is materially lower than shipped/executed copyleft code. Reading question (does "production dependency tree" mean runtime-bundle or everything npm ls --omit=dev prints) is for the operator, not resolvable by a probe.

No IMPORTANT, BLOCKER, or CRITICAL findings. No secrets found. No auth-path gap found. No CVE regression found (drizzle-orm genuinely patched; next-auth genuinely pinned).

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis.

### CHECKED

- Dep audit (npm audit --omit=dev --audit-level=high, exit0) and --omit=dev --json metadata (moderate:3, high:0, critical:0) -- both run and quoted above.
- drizzle-orm CVE resolution -- cross-checked against GitHub Advisory API (first_patched_version: 0.45.2), lockfile-resolved version confirmed 0.45.2.
- next-auth pin -- confirmed 5.0.0-beta.25 in package.json and lockfile.
- License sweep of full --omit=dev --all tree (232 listed, 137 actually installed) -- method and full result quoted above; two non-permissive installed packages found and traced to build-time-only role.
- Secret scan of diff (regex sweep, all hits inspected and cleared) and of history (secret-sweep.mjs, SWEEP CLEAN, 65381 lines scanned).
- Credential-handling code path in prod-verify.mjs and backup-prod.ts -- read line-by-line, confirmed commented-line-only regex, confirmed no console call ever includes url/token; prod-verify.mjs re-run live against production, raw output inspected for leakage (none).
- .gitignore / tracked-file check for .env*, Database Token.txt, .lnk -- all clean.
- db:push disarm auth-path trace -- code read, gate re-run live (PUSH-GUARD OK), confirmed guard sits before the privileged spawn call, confirmed spawn args are static literals (DEP0190 warning is non-exploitable noise here).
- backup-prod.ts identifier-interpolation path checked against the exact CVE-2026-39356 vulnerability class -- confirmed not exploitable (fixed allowlist input, no attacker-controlled data reaches it).
- Rotation posture (D18/A1) cross-read against ESCALATIONS E2 and .chuck/gates.json's live 12-gate M0 list -- internally consistent; Database Token.txt absence independently confirmed.
- New-dependency drift -- package.json diff read in full; only sanctioned changes present.
- Dedupe of @tailwindcss/postcss -- confirmed via lockfile.
- EOL gate -- re-run independently, EOL OK.
- COPPA/IoT/device applicability -- grepped diff, zero hits, confirmed out of scope for this milestone.
- Branch protection posture -- confirmed settled per DECISIONS D4/Invariant 2, cited not re-probed.

### NOT CHECKED

- Whether the Resend/Turso rotation was ACTUALLY performed at the provider (Resend dashboard, Turso token issuance) -- no repo-side probe can reach a third-party provider's account state; this is operator attestation (E2) and explicitly outside my lane per this cycle's assignment.
- COPPA/store-privacy/IoT deep review -- deferred, no diff surface exists yet in M0 to review; will apply when a content/data-collection milestone lands.
- Whether libsql's HTTP client could ever embed the auth token in a thrown Error.message inside backup-prod.ts's catch-all (line 248) -- a generic third-party-library question, not diff-specific; no safe way to force that error path against production under D8's sanctioned read/write boundaries.
- M3/M4 rotation follow-through (dedicated Resend account, magic-link send test, Vercel-preview confirmation) -- correctly deferred per A1, out of M0's scope; will re-check at the milestone where they are due.

### COULD NOT CHECK

- None. Every probe I attempted this cycle executed successfully; no command failed or was blocked.

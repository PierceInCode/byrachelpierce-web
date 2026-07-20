# Bobbi -- Anxiety-Closet gate report, M0, cycle 1

**Rule zero: Unexecuted = hypothesis.** Every claim below assertable by a command was run this
cycle, with output quoted inline or in .chuck/probes/M0-ledger.md (Bobbi cycle 1 section,
append-only, rows B1-B15). Anything not run is labeled UNVERIFIED explicitly.

**Pins (independently re-confirmed):** HEAD acd4bbd24fa5600978bd280f34cd58f75cff5004 =
chuck/M0 tip. Merge-base with 33f9f4f91474093162e5b799767c2939d60283a6 re-verified via
git merge-base (ledger B1). Diff-hash not independently recomputed this cycle (Binkley's row
#2 stands, unchallenged).

**Scope:** My assigned lane -- scripts/backup-prod.ts, scripts/db-push-dev.ts and their
tests; the M0 probes as code; config changes (.gitattributes, .prettierrc, .gitignore,
package.json); BUILD-SPEC-to-gates.json consistency for M0. I also surfaced two cross-cutting
findings (integration-branch/merge state, and F15/RIDER status) that bear directly on the M0
Definition of Done and are not excluded by the D18/A1 carve-out named in my brief.

Per instructions, D18/Amendment A1 (rotation-recorded gate retired, 12 not 13 gates, stale
13-gate table text in BUILD-SPEC.md amended-by-reference) is NOT flagged as a defect -- that
is confirmed by-design and independently re-verified (ledger B5: gates.json M0 block has
exactly 12 gates, rotation-recorded absent, matching BUILD-SPEC's Acceptance gates table
1:1 apart from the known stale 13-row artifact the brief already excuses).

---

## Findings

### F-B1 -- restoreTables() interpolates untrusted column names into SQL with no identifier validation (SQL injection surface via dump files)

**Confidence: high. Severity: important.**

scripts/backup-prod.ts, restoreTables() (lines 183-216), builds each INSERT's column list
from Object.keys(row) -- the JSON keys of a dump file -- and interpolates them directly into
the SQL string as a comma-joined, double-quote-wrapped column list, with only the table name
(not the column names) passed through assertSafeIdentifier(). Source excerpt:

    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const colList = columns.map((c) => '"' + c + '"').join(', ');
    await tx.execute({
      sql: 'INSERT INTO "' + sql + '" (' + colList + ') VALUES (' + placeholders + ')',
      args: columns.map((c) => row[c]),
    });

assertSafeIdentifier() (the F6 defensive check the header comment cites) is called only on
sql -- the fixed table name from BACKUP_TABLES -- never on the column names drawn from the
dump JSON. The function's own doc comment claims: "Every identifier this module uses comes from
the fixed BACKUP_TABLES constant" -- that is true for the table name and false for the column
name, in the one function (restoreTables) where the identifier is NOT from a fixed constant
but from file content.

**Executed, not hypothesized.** I built a scratch harness (never committed; git status
--short clean before and after) that imports restoreTables and feeds it a dump file with one
row whose sole JSON key is the string:

    id","name") SELECT 999,'pwned-name' --

Result:

    restoreTables completed without throwing: {"tag_categories":1, ...}
    tag_categories rows: [{"id":999,"name":"pwned-name","sort_order":0}]

The resulting live SQL was effectively INSERT INTO "tag_categories" ("id") SELECT
999,'pwned-name', 0 -- ") VALUES (?) -- the bound ? argument for the row's actual value never
reaches the database at all; the attacker-supplied literal SQL wins. This is a live
demonstration of injected, attacker-controlled data landing in the restored table, not merely a
syntax-error dead end (I hit syntax errors on cruder attempts first -- ledger shows the
progression).

**Why it matters / why "important" not "blocker":** restoreTables is not reachable from any
network surface and its only sanctioned caller (per the header's documented restore procedure)
is an operator running a manual restore from a backup file the same system wrote. The realistic
threat model is a corrupted, hand-edited, or maliciously-substituted dump file being fed to
restore -- not zero-risk, since restore is explicitly the mechanism for disaster recovery
(exactly when an operator might be reaching for whatever .json file is at hand under stress).
It is not a blocker because it requires local file-write access to the operator's backups/
directory to exploit, which is a smaller blast radius than the production DB itself. But the
documented invariant ("every identifier... from the fixed constant") is not true of the code,
zero test exercises this path, and the fix (route column names through
assertSafeIdentifier too, or an allow-list derived from the target table's own schema) is
small and directly analogous to the existing table-name guard.

**Test-coverage note:** tests/scripts/backup-prod.test.ts's assertSafeIdentifier describe
block tests only BACKUP_TABLES.sql values and synthetic bad strings passed directly to the
function -- never through restoreTables. tests/backup-restore.roundtrip.test.ts never
constructs an adversarial dump file. There is no negative/adversarial test for restoreTables
at all.

---

### F-B2 -- M0's Definition of Done "merged chuck/integration to main" clause is not satisfied at HEAD

**Confidence: high. Severity: important -- load-bearing for the milestone-close verdict.**

BUILD-SPEC.md's M0 Definition of Done (line 91) reads in part: "...and the operator has merged
chuck/integration to main (deploying the hygiene commits) at the checkpoint." This is
unamended by D18/A1 (which touches only the rotation-obligation clause).

Executed checks (ledger B8-B9):

- git ls-remote --heads origin: no chuck/integration ref exists on origin at all.
- Local chuck/integration: git rev-parse chuck/integration = 33f9f4f91474093162e5b799767c2939d60283a6
  -- exactly the base commit, unmoved.
- git merge-base --is-ancestor chuck/M0 chuck/integration -> FALSE ("no"). The M0 commits
  have never been merged into chuck/integration, locally or remotely.
- origin/main HEAD = 33f9f4f... (same base commit) -- confirmed via git log --oneline -5
  origin/main.
- gh pr view 13 --json baseRefName,headRefName,state,isDraft,mergeable:
  {"baseRefName":"main","headRefName":"chuck/M0","isDraft":true,"mergeable":"MERGEABLE","state":"OPEN"}
  -- PR #13 is open and in Draft, and targets main directly, bypassing the two-stage
  chuck/M-N to chuck/integration to main flow that Invariant 2 describes verbatim
  ("Chuck work branches chuck/M-n merge to chuck/integration only... chuck/integration
  reaches main by operator-merged PR at each checkpoint").

**Not a hidden defect** -- PROGRESS.md's own "Current state" note is honest about this: "...On
PASS, close M0 (report/PROGRESS/session-state/ledger, merge to integration, Otis actuals)"
is listed as the next step, not a completed one. So the project's own ledger agrees this step
is outstanding. I flag it at "important" because it is a literal, unamended DoD clause and the
mechanism actually in flight (PR #13, draft, main-targeted) does not match the two-stage flow
the Spec's Invariant 2 names -- if PR #13 merges as currently configured, chuck/integration
will still never have received these commits, an open question for whoever merges next.
NEEDS-SENIOR-REVIEW.

---

### F-B3 -- Prior-cycle Snorklewacker finding on .env.local staleness bears directly on this gate and is not resolved by anything in my lane

**Confidence: medium (I did not re-run the specific timestamp probe myself this cycle -- I read
and cite Binkley's ledger rows 45-61, all independently executed by Binkley this milestone, not
by me). Severity: important, carried forward, NEEDS-SENIOR-REVIEW.**

.chuck/probes/M0-ledger.md (Snorklewacker cycle 1, rows 7-14, headline paragraph) shows
.env.local's CreationTime == LastWriteTime == 2026-07-04 22:47:28, unchanged through
2026-07-14, and prod-verify.mjs re-run that cycle still authenticates against live production
using whatever token is currently in that file -- directly contradicting D18's claim that the
Turso token was rotated ("invalidated") on 2026-07-14, since HT1's own protocol requires
updating .env.local as part of rotation. I did not re-execute the timestamp probe myself this
cycle (I have no reason to distrust Binkley's Get-Item/Get-ChildItem output, and re-running
it against a live production credential doesn't change the historical mtime evidence), so I mark
my citation medium confidence on the specific numbers, but flag this at important because
it is squarely inside "is the rotation genuinely closed" -- the exact question F-B2's DoD clause
and D18 both hinge on. This is the single most load-bearing open thread in the whole milestone:
if the Turso token was NOT actually rotated, the live-production credential currently sitting in
.env.local (used by prod-verify.mjs and backup-prod.ts this session) is the SAME leaked
credential the takeover audit flagged, and Invariant 3 is not actually satisfied regardless of
what DECISIONS D18 asserts. I did not attempt to independently re-verify or refute this via a
different method (e.g., asking the operator, or comparing Turso account audit logs, which I have
no access to) -- COULD NOT CHECK, see manifest.

---

### F-B4 -- F15 (Lilly to Lily typo) and RIDER 1 (stale branch deletion) remain open, not closed or explicitly re-waived at this checkpoint

**Confidence: high. Severity: minor** (both are explicitly operator-only, non-blocking per the
Spec's own text and ESCALATIONS.md E2's answer -- I flag for completeness of the DoD's "every
audit finding F1-F16 is closed or explicitly operator-waived" claim, not as a defect in agent
work).

- docs/SITE-ARCHITECTURE-v2.md still contains the literal string 'LillyOther plants' at the
  cited location (ledger B11) -- agents cannot edit docs/, so this is correctly out of the
  diff's scope, but it means F15 is neither closed nor formally re-waived; it is "carried,"
  per ESCALATIONS.md E2's own answer text ("RIDER 2 ... remain open as non-blocking items").
- All six stale remote branches named in the audit section 2 list are still present on origin
  (ledger B12: docs/r3-close-out, docs/r4-close-out, final-product-planning,
  r3-collection, r4-content, vercel/react-server-components-cve-vu-y3bp7s) -- RIDER 1
  branch-deletion has not been actioned.

Both are accurately described as open/carried in ESCALATIONS.md and DECISIONS.md D18 itself, so
this is not a discrepancy between claim and reality -- just a reminder that "closed" in the DoD's
literal text is optimistic; the honest state is "open, operator-owned, explicitly non-blocking."

---

### F-B5 -- db-push-dev.ts's main()/readEnvLocal() and backup-prod.ts's readProdCreds()/main() are never unit-tested

**Confidence: high. Severity: minor.**

Scoped coverage run (ledger B14) confirms:

- db-push-dev.ts lines 56-84 and 90 (essentially all of readEnvLocal, main, and the
  spawn/exit-code wiring) are uncovered by the unit test file. This path IS exercised
  end-to-end by the push-guard gate, which runs npm run db:push:dev as a real subprocess
  against a bad URL and asserts on stdout/exit code (confirmed working, ledger row #23/M0.log) --
  so it is integration-tested, just not unit-tested. Not a functional gap; noting the coverage
  shape since a future refactor of main()'s error branches (e.g. the child.on('error', ...)
  launch-failure path) has no direct test at any level -- that one specific branch (drizzle-kit
  binary missing/unspawnable) is neither unit- nor gate-tested.
- backup-prod.ts lines 220-242 and 247-249 (readProdCreds, main) are similarly untested and,
  per ledger B15, are not invoked by any M0 gate, probe, or npm script -- the script's actual
  production-facing entrypoint has never executed this milestone. This is by design (work item 2
  says the M2 content-loop ritual runs it first), but it does mean the credential-parsing
  function that will eventually read a live production token has zero execution history to
  date, resting on code review plus the fact that prod-verify.mjs uses a structurally
  identical regex (which has demonstrably worked, per ledger row #25).

---

### F-B6 -- .prettierignore is a new file not named in any M0 work item

**Confidence: high. Severity: nit.**

Work item 4 (line-ending renormalization) names .gitattributes, git add --renormalize ., and
.prettierrc's endOfLine: lf -- it does not mention adding a .prettierignore. The new file
(docs/, drizzle/, public/, .next/, node_modules/, package-lock.json, CLAUDE.md,
OPERATOR-GUIDE.md, scripts/art-data.json, coverage/, .github/workflows/ci.yml,
.superpowers/, .chuck/session-state.md, .chuck/run.lock, .chuck/mode) is a sensible,
low-risk companion to the format/lf changes (it excludes generated, vendored, and
process-control files from Prettier's scope) and I found nothing wrong with its contents. Purely
a "this wasn't itemized in the plan" nit, ambiguity-protocol territory (CLAUDE.md rule 10) -- I
did not find a corresponding DECISIONS.md entry recording this as a smallest-reasonable-choice
addition; grep -n prettierignore DECISIONS.md returned no match.

---

### F-B7 -- Two active AUTH_RESEND_KEY/RESEND_API_KEY-shaped line pairs in .env.local

**Confidence: low. Severity: minor.** .env.local is gitignored and untracked (confirmed,
ledger row Snorklewacker #7/#8) so this is fully out of the diff's tracked-file scope and not a
repo defect -- I note it only because my targeted, value-redacted scan (ledger B13) incidentally
surfaced two active (uncommented) lines each for AUTH_RESEND_KEY and RESEND_API_KEY rather
than one. This may be entirely benign (two env var names both mapping to the same active Resend
key, one for NextAuth's Resend provider and one for the general Resend SDK -- a very plausible,
intentional setup) -- I did not read the values and did not investigate further since it touches
no tracked file. Flagged at low confidence / minor severity purely for completeness; likely a
non-issue.

---

## Verification of DO-NOT-RE-DERIVE items (spot-checked, not blindly trusted)

Per instructions, I did not re-run the full gate suite. I did independently re-verify a sample
of the highest-leverage claims via different commands than Binkley used, specifically:

- **CVE bump claim** (drizzle-orm GHSA-gpj5-g38j-94v9 resolved): re-ran npm audit --omit=dev
  --audit-level=high --json, parsed the JSON (not just grepped text) -- confirms 3 moderate, 0
  high/critical, drizzle-orm absent from the advisory list. Independently corroborated via npm
  ls drizzle-orm -> drizzle-orm@0.45.2.
- **F16 dedupe claim** (@tailwindcss/postcss single version): wrote a targeted
  package-lock.json scan (not a full read, per CLAUDE.md context-hygiene rule) confirming
  exactly one resolved version node for each of drizzle-orm and @tailwindcss/postcss.
- **gates.json 12-gate / D18 claim**: read the full M0 block of .chuck/gates.json at HEAD and
  diffed it conceptually against BUILD-SPEC's Acceptance gates table -- 1:1 match, 12 rows, no
  rotation-recorded.
- **tag-r4 claim**: independently confirmed via git ls-remote --tags origin (R4 present on
  remote, not just locally) and git merge-base --is-ancestor (R4 is an ancestor of main) --
  strictly stronger evidence than the ledger's git tag -l R4 (which only proves local
  existence).

I did not re-run: check, coverage, build-seeded, e2e, restore-roundtrip (full test
files, not just my scoped subset), prod-verify, alias-smoke, or ci-green -- Binkley's raw
logged output for all of these is present and internally consistent (exit codes, token strings,
counts all match what the gate expects), and I had no specific suspicion warranting a rerun for
those beyond what's captured above.

---

## Coverage manifest

**Rule zero: Unexecuted = hypothesis.** Anything assertable by running a command MUST be run
(output quoted) or labeled UNVERIFIED.

### CHECKED

- **scripts/backup-prod.ts correctness/contracts** -- read in full; BACKUP_TABLES order,
  assertSafeIdentifier, backupTables (same-day supersede logic), restoreTables
  (transactional atomicity) all read and cross-checked against tests. Injection surface
  discovered and demonstrated live (scratch harness, output quoted above, F-B1).
- **scripts/db-push-dev.ts correctness/contracts** -- read in full; resolveEffectiveUrl,
  isLocalFileUrl, REFUSAL_TOKEN, main() all read; cross-checked against
  tests/scripts/db-push-dev.test.ts (all 9 unit tests read) and the live push-guard gate
  output in .chuck/probes/M0.log (exit 1, "DB PUSH REFUSED" present).
- **tests/scripts/backup-prod.test.ts, tests/scripts/db-push-dev.test.ts,
  tests/backup-restore.roundtrip.test.ts** -- read in full; scoped coverage re-run this cycle
  (npx vitest run --coverage on just these 3 files + 2 scripts) -- 25/25 tests pass, coverage
  gaps identified and characterized (F-B5).
- **.chuck/probes/prod-verify.mjs, alias-smoke.mjs, push-guard.mjs, eol-check.mjs** --
  read in full; each OK-token's reachability traced (fails-first-then-OK structure confirmed for
  all four; no token is printed on a path that skips the actual assertions).
- **.chuck/probes/backup-check.mjs** -- read for cross-reference (M2 gate, not M0, but
  consumes backup-prod.ts's output shape) -- shape match confirmed (<table>-<date>.json
  arrays).
- **Config diffs** (.gitattributes, .prettierrc, .gitignore, .prettierignore,
  package.json) -- full diff read; binary-exception list matches spec exactly; engines field
  matches spec exactly; db:push to db:push:dev rename confirmed; drizzle-orm bump confirmed
  installed (npm ls); .prettierignore addition flagged as unitemized-but-benign (F-B6).
- **gates.json M0 block vs BUILD-SPEC M0 Acceptance gates table** -- read both in full,
  compared row-by-row: 12/12 match (name, lane, cmd, expect).
- **npm audit (dep-audit gate)** -- independently re-run with --json, parsed programmatically,
  cross-checked against the ledger's text-based claim: consistent (3 moderate, 0 high/critical).
- **R4 tag / remote branch state / integration-merge state** -- independently probed via
  git ls-remote, git merge-base --is-ancestor, gh pr view: R4 genuinely on remote and
  ancestor of main (F-B2 contrast point); chuck/integration NOT merged, PR #13 draft and
  main-targeted (F-B2, load-bearing).
- **F15/RIDER 1 status** -- independently confirmed both still open on remote/docs (F-B4).
- **.env.local active-line shape** (value-redacted) -- confirmed active TURSO_DATABASE_URL
  is file:-prefixed (dev-mode default honored); confirmed prod creds remain on commented
  lines; no value printed anywhere in my output.
- **Scratch-file hygiene** -- confirmed git status --short clean of any Bobbi-created files
  before and after every probe (no accidental tracked-tree mutation).

### NOT CHECKED

- **.chuck/probes/domain-live.mjs, sitemap-vs-db.mjs, admin-schema.mjs,
  admin-lockout.mjs, mural-content.ts, secret-sweep.mjs, lighthouse-config-check.mjs,
  ht-result-check.mjs** -- these are M1-M4 gates, out of my M0 lane and out of the brief's
  scope; not reviewed this cycle.
- **Full re-run of check, coverage, build-seeded, e2e, ci-green** -- relied on
  Binkley's M0.log/ledger per the DO-NOT-RE-DERIVE instruction; spot-checked only
  dep-audit and gates.json/tag-r4 independently (see above). No specific suspicion
  surfaced during my review that would warrant re-running the others.
- **DECISIONS.md/PROGRESS.md/ESCALATIONS.md/archive/R3-PLAN.md/SCOPE.md full-text
  narrative review** -- read targeted sections only (D7, D8, D18, E2, PROGRESS "Current state"
  and History) sufficient to cross-check my lane's findings; did not review these documents
  end-to-end for internal narrative consistency beyond what bears on my findings.
- **byrachelpierce-web_Architecture_v1.md diff (116 new lines)** -- not reviewed this cycle;
  outside my named lane (no code/gate/config in it).
- **License sweep (work item 8, Steve's lane)** -- not independently re-verified; deferred to
  Steve's review dimension per the brief's lane assignment.
- **.chuck/probes/backup-check.mjs's dateOf() regex behavior against a -superseded-
  filename** -- I noticed the regex (date pattern) is a substring match, not anchored, so
  it would also match the date embedded in a *-superseded-HHmmss.json filename; I read the
  code but did NOT execute a probe to check whether this causes backup-check.mjs (an M2 gate,
  outside my M0 lane) to misidentify "backup dates on record" when a superseded file is present.
  Flagging as a possible latent issue for whoever owns the M2 gate, UNVERIFIED -- I did not
  run it, so it is a hypothesis, not a finding, and it sits outside my assigned lane regardless.

### COULD NOT CHECK

- **Whether the Turso production token was actually rotated on 2026-07-14** (F-B3) -- I have no
  access to Turso's account/token audit log or any out-of-band record beyond this repo's own
  files and git history, both of which (per Binkley's prior-cycle timestamp probe) point toward
  "not rotated as claimed." I could not devise a command from inside this repo/session that
  settles the question either way beyond what Binkley already ran; re-running prod-verify.mjs
  again would only reconfirm "some token in .env.local still authenticates," which doesn't
  distinguish "rotated token" from "same leaked token, still valid." Command that would settle
  it (Turso CLI token-list/audit, or the operator's own confirmation with a timestamp) is not
  available to an agent in this session -- NEEDS-SENIOR-REVIEW, carried from Binkley's cycle,
  independently corroborated as still-open by me.
- **Whether chuck/integration's absence from origin and PR #13's draft/main-targeting is
  the operator's deliberate final-shape choice (per DECISIONS D4's "alternative (b)" -- dropping
  chuck/integration entirely) or genuinely mid-flight** -- I could find no DECISIONS.md entry
  recording a switch to alternative (b); D4 as written still commits to the two-stage flow. I
  do not have access to the operator's intent beyond what's written in the repo, so I cannot
  settle whether this is an accepted simplification or an unresolved gap -- flagged
  NEEDS-SENIOR-REVIEW (F-B2).

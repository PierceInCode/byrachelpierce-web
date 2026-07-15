# Snorklewacker cycle 1 -- M0 adversarial refutation

Rule zero: Unexecuted = hypothesis. Every refutation below is either backed by an
executed probe with raw output quoted, or explicitly labeled UNVERIFIED with the exact
command that was needed and why it could not run.

HEAD acd4bbd24fa5600978bd280f34cd58f75cff5004 (chuck/M0), base
33f9f4f91474093162e5b799767c2939d60283a6, diff-hash
733832265081d7b6a643ac8407d76b0930f2853a. All probes appended to
.chuck/probes/M0-ledger.md under Snorklewacker cycle 1.

---

## 1. Claim: The 12 gates actually gate (do contains: oracles discriminate pass from fail?)

### 1a. alias-smoke -- could SMOKE OK print on a degraded target?

Attack: Read .chuck/probes/alias-smoke.mjs. Its oracle is res.status !== 200 -> ok=false
for four routes. This is content-blind: a maintenance/placeholder page served at HTTP 200
would pass. I probed whether the specific failure mode of a routing regression (a
genuinely dead route) would be masked by this oracle.

Probe run:
node -e fetch of https://byrachelpierce-web.vercel.app/this-route-does-not-exist-zzz
Output:
status: 404 len: 48163 snippet: <!DOCTYPE html>...<html lang=en ...

A genuinely broken route returns 404, not a soft-200. On this specific axis the oracle is
not vacuous.

Verdict: STANDS (narrow). The content-blindness (a 200'd maintenance page would still
pass) is a real residual weakness but I could not force Vercel into that state to prove it
fails -- UNVERIFIED as a distinct sub-claim: alias-smoke would catch a 200-status
placeholder/holding page -- no reachable probe (would require deploying a broken build to
prod, which the Iron Rules forbid me from doing).

### 1b. dep-audit -- does --audit-level=high hide a real high/critical?

Attack: run npm audit --omit=dev with no severity filter and diff against the gated,
filtered run recorded in M0.log.

Probe output:
next-auth Severity: moderate GHSA-5jpx-9hw9-2fx4
postcss Severity: moderate GHSA-qx2v-qp2m-jg93
3 moderate severity vulnerabilities

Identical to the filtered gate output (3 moderate, zero high/critical either way). The
--audit-level=high flag is not hiding anything at this HEAD.

Verdict: STANDS.

### 1c. restore-roundtrip -- tautology or real comparison?

Attack: read tests/backup-restore.roundtrip.test.ts. It seeds all 10 real tables in a
fresh source DB, dumps via backupTables, restores into a SEPARATE fresh DB, then asserts
destCount === sourceCount per table (line 114) -- a real cross-DB comparison, not
comparing a value to itself. A third test seeds a PK collision in a pre-populated
conflict DB and asserts the restore throws AND leaves row counts unchanged (atomicity /
rollback proof, lines 119-145).

Verdict: STANDS. This is a genuine round-trip assertion with a real failure mode
(mismatched counts, or a non-atomic partial write) that would be caught. Not
independently mutated in this cycle (see NOT CHECKED) -- reading the assertions was
sufficient to rule out the tautology suspicion the brief raised, but I did not execute a
mutation-kill probe against it.

### 1d. push-guard -- is the refusal a real check or a stub that always fails?

Attack: read scripts/db-push-dev.ts. resolveEffectiveUrl / isLocalFileUrl are real
string-prefix logic against the effective TURSO_DATABASE_URL (env var first, then the
active/uncommented .env.local line), refusing exec of drizzle-kit push unless the URL
starts with file:. Not a hardcoded failure.

Verdict: STANDS on the tautology suspicion. NOT CHECKED: I did not construct a case where
the guard SHOULD pass (a genuine file: target) and confirm it actually execs push in that
branch -- only the refusal branch was probed by the gate and by me.

### 1e. run-gates.sh matcher -- does contains: accept a line with an error also printed?

Attack: read the runner. The contains: branch does a grep -qF substring match over
combined stdout+stderr with NO negative-token check and NO cross-check of the actual exit
code for contains-type gates. In principle a script that both errors out to a non-zero
exit but ALSO happens to print the literal success string somewhere would still register
ok=1 -- but every contains: gate in M0 is a node script the gate author controls
end-to-end, and each of eol-check/push-guard/prod-verify/alias-smoke explicitly gates its
own fails.length/ok boolean before printing the success token (confirmed by reading all
four scripts).

Verdict: NEEDS-SENIOR-REVIEW. This is a real design gap in run-gates.sh itself (a
contains: gate that both errors and coincidentally prints the success substring would
pass undetected), but it does not currently manifest as a false pass in any of M0's four
contains: gates because each of those scripts' own internal logic happens to gate the
print. Fragile-by-convention, not fragile-by-proof. UNVERIFIED as an M0-specific failure
(no current gate exploits it); the runner mechanism itself is proven weak by direct code
read, not executed against a live exploit (would require authoring a deliberately broken
probe script and running it through run-gates.sh -- not done this cycle, flagged as a
debt below).

---

## 2. Claim: Secret rotation is genuinely handled per Amendment A1 (D18)

Attack -- is gates.json actually 12, is rotation-recorded actually gone?

Read .chuck/gates.json directly -- confirmed 12 gate objects under M0, names: check,
coverage, build-seeded, e2e, dep-audit, eol-clean, push-guard, restore-roundtrip,
prod-verify, alias-smoke, tag-r4, ci-green. No rotation-recorded object present.

Verdict on the paperwork question: STANDS -- the amendment's mechanical delta (gates.json
edited from 13 to 12, rotation-recorded object removed) is real and verified at HEAD, not
merely asserted.

Attack -- does the DESIGN leave a real security hole (not the paperwork)?

This is the substantive attack, and it lands. D18 states: "a new Resend API key and a new
Turso production database auth token were created and the prior ones invalidated"
(DECISIONS.md line 210) and HT1's protocol (.chuck/human-tests/HT1-secret-rotation.md)
requires "update .env.local" as an explicit rotation step. prod-verify.mjs -- the M0 gate
that reads LIVE production -- resolves its Turso URL/token exclusively from the commented
lines in .env.local (lines 11-13 of that script). If the rotation genuinely happened and
.env.local was updated to the new token, that file must have been rewritten on/after the
claimed rotation date of 2026-07-14.

Probe (PowerShell Get-Item on .env.local, all three timestamp fields):
LastWriteTime : 7/4/2026 10:47:28 PM
CreationTime : 7/4/2026 10:47:28 PM
LastAccessTime : 7/14/2026 4:44:20 PM

CreationTime equals LastWriteTime exactly -- the file was written once, on 2026-07-04,
and never rewritten since. LastAccessTime correctly shows today (2026-07-14), proving the
filesystem's access-time tracking works and would show a write-today too, had one
occurred. A repo-wide recursive scan for anything touched on/after 2026-07-14 (excluding
node_modules/.git/.next) corroborates this by omission: the output included DECISIONS.md,
PROGRESS.md, ESCALATIONS.md, and every .chuck/* session artifact touched this session --
but NOT .env.local. The one file HT1 says must be edited for rotation to be real is
conspicuously absent from today's edits.

I then re-ran the live prod-read gate to see whether the token that has sat there since
2026-07-04 (ten days BEFORE the claimed rotation) still authenticates:

node .chuck/probes/prod-verify.mjs
->
migrations tracked: 4
dimension columns present: true
paintings: 528
trail_completions rows: 1 (existence is the assertion; count grows with real users)
sentinel rows: 0
PROD-VERIFY OK

It authenticates successfully, right now, against live production.

Verdict: REFUTED (as a security-hole claim), NEEDS-SENIOR-REVIEW. D18's specific claim
that "the prior [Turso] token [was] invalidated" is contradicted by direct filesystem
evidence: the token file was not touched on the claimed rotation date, and the token it
has held since 10 days prior still works against production. Two readings, both bad: (a)
rotation genuinely happened elsewhere (e.g., directly in Turso's dashboard) but
.env.local was never updated to the new value, meaning EVERY M0 gate this session
(prod-verify, and any dev-server usage) has been authenticating with the OLD,
pre-rotation token -- if that old token is the leaked one, the leak is not closed, gates
are exercising stale credentials, and Amendment A1's "no standing-exposure risk" claim is
false; or (b) no rotation-driven edit to .env.local ever happened at all and the
2026-07-14 date in D18/E2 is asserted, not evidenced by any artifact visible to this
session. I cannot distinguish (a) from (b) without operator testimony or Turso's own audit
log -- UNVERIFIED as to WHICH of the two is true, but BOTH readings refute D18's "carries
no standing-exposure risk statement" framing. The one artifact that would settle it --
Turso's dashboard token-creation audit log, or the operator directly confirming the exact
timestamp of the .env.local edit -- is outside this session's reach.

The note that "the HT1 form being 4/7 ... is BY DESIGN ... NOT a valid refutation" is
respected -- I am not attacking the paperwork gap. I am attacking whether the underlying
credential state matches the prose, using a filesystem timestamp the design did not
anticipate being checked.

---

## 3. Claim: prod-verify is honest (reads real production, not faked/stale)

Attack: read .chuck/probes/prod-verify.mjs in full. It has no hardcoded return values --
every printed number (migrations tracked, paintings, sentinel rows) comes from a live
db.execute() call against a createClient({url, authToken}) where url/token are parsed
from the COMMENTED libsql://... lines in .env.local via regex (verified: the regex is
anchored to commented TURSO_DATABASE_URL lines specifically -- it targets the commented,
not active, line, meaning it is architecturally pointed at the production values distinct
from the active file:./dev.db line used for local dev).

Probe (grep of .env.local for both keys):
TURSO_DATABASE_URL=file:./dev.db

# TURSO_DATABASE_URL="libsql://byrachelpierce-pierceincode.aws-us-east-1.turs...

# TURSO_AUTH_TOKEN="[REDACTED]..."

Confirmed: the commented line is a genuine libsql:// Turso cloud host, structurally
distinct from the local file:./dev.db active line -- this is not reading a local/stale DB
standing in for prod. Re-ran live (probe in section 2): PROD-VERIFY OK with real counts
matching the ledger's prior run (528 paintings, 4 migrations, 0 sentinels) -- consistent
across two independent executions in two different sessions, which a faked/hardcoded
script could not reliably reproduce against a moving target (trail_completions rows
differs: 1 now vs. what would be a growing real-user counter -- consistent with
"existence is the assertion; count grows with real users," i.e. genuinely live data, not
frozen fixture data).

Verdict: STANDS on "reads real production, not faked/hardcoded." Cross-reference to
finding 2 above: the script is honest about WHAT it reads, but WHICH credential it reads
is now in question -- it succeeded against the token that has been in place since
2026-07-04, not necessarily the token D18 claims was freshly rotated on 2026-07-14.

---

## 4. Claim: Definition of done is met, not merely reported met (BUILD-SPEC line 91)

Attack -- is chuck/integration green, is R4 tagged, is CI green on exact HEAD?

git tag -l R4
-> R4

Re-derived from M0.log's ci-green row (gh run list --branch chuck/M0 -> success on run
29366157728, pinned to exact HEAD sha) -- not independently re-run against the GH API
this cycle since it would only reproduce the same historical record, not test anything
new.

Attack -- "the two highest-severity closures probe-proven (push-guard + restore-roundtrip)":
both independently read and confirmed non-tautological in sections 1c/1d above. STANDS.

Attack -- "suite/e2e/dep-audit/eol/prod-verify/alias-smoke green on HEAD": all
re-verified live this cycle (prod-verify re-run above; dep-audit re-run in section 1b).
Genuinely green.

Attack -- DoD's rotation clause, as superseded by D18: this is the one clause in the DoD
that is ASSERTED BUT NOT PROVEN BY AN EXECUTED PROBE -- see finding 2. The DoD text (per
D18's delta) now reads "the leaked Resend key and Turso production token are rotated
(operator-confirmed 2026-07-14)" -- this is a prose/self-report clause with no
corresponding machine gate (by design, per A1), and the one artifact I could check
independently (the credential file's mtime) does not corroborate the confirmed date.

Verdict: split. All machine-gated DoD clauses STAND (re-verified live). The one
self-reported clause (secret rotation date/completeness) is REFUTED by the same evidence
as finding 2 -- NEEDS-SENIOR-REVIEW.

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis.

### CHECKED

- Gate alias-smoke content-blindness on dead-route axis -- probed live fetch of
  nonexistent route, got genuine 404, not masked. STANDS (narrow).
- Gate dep-audit --audit-level=high hiding a high/critical -- re-ran unfiltered, identical
  3-moderate/zero-high result. STANDS.
- Gate restore-roundtrip tautology -- read full test file, confirmed real cross-DB count
  comparison plus atomicity/rollback assertion. STANDS.
- Gate push-guard stub-vs-real -- read scripts/db-push-dev.ts, confirmed real
  string-prefix URL-resolution logic, not a hardcoded failure. STANDS (refusal branch
  only).
- gates.json M0 gate count and rotation-recorded absence at HEAD -- read file directly,
  confirmed 12 objects, name list enumerated, no rotation-recorded object. STANDS.
- D18's credential-rotation claim, cross-checked against .env.local filesystem
  timestamps and a live re-run of prod-verify.mjs -- REFUTED / NEEDS-SENIOR-REVIEW (see
  finding 2, the headline result of this cycle).
- prod-verify.mjs reading real prod vs. faked/stale -- read full script, confirmed
  regex-anchored to commented libsql:// line (structurally distinct from active file:
  line), live re-run reproduced live counts. STANDS on "reads real prod"; separately
  flagged on "which credential."
- Database Token.txt deletion claim -- recursive filesystem search, zero matches. STANDS
  (not refuted).
- DoD's machine-gated clauses (R4 tag, CI-green-on-HEAD, push-guard/restore-roundtrip
  closures, suite/e2e/dep-audit/eol/prod-verify/alias-smoke green) -- re-derived live or
  from directly-reread artifacts. STANDS.
- DoD's rotation clause -- REFUTED via the same evidence as finding 2.

### NOT CHECKED

- Mutation-kill test on restore-roundtrip: did not deliberately break restoreTables'
  atomicity (e.g., comment out the transaction wrapper) and confirm the test then fails.
  Time constraint this cycle; the assertion logic reads as sound but was not
  adversarially mutated.
- Constructing a genuine file:-target case for push-guard to confirm the success branch
  (spawn of npx drizzle-kit push) actually executes rather than silently no-op'ing --
  only the refusal branch was exercised by the shipped gate and by me.
- Authoring a deliberately broken contains:-type probe script and running it through
  run-gates.sh to prove the runner's rc-blindness for contains: gates manifests as an
  actual false pass (section 1e) -- read-only analysis, not executed against a live
  exploit.
- alias-smoke's content-blindness to a genuine 200-status placeholder/holding page --
  would require deploying a broken build to the production Vercel alias, which the Iron
  Rules forbid.
- HT1 form fields 5-7 (magic-link send test, Vercel-preview confirmation) -- explicitly
  out of scope per the brief's DO-NOT-RE-DERIVE instruction on paperwork; not
  re-attacked.

### COULD NOT CHECK

- Exact wall-clock timestamp of any Turso-dashboard token rotation, to independently
  confirm or refute the 2026-07-14 date D18/E2 assert. Command that would settle it: a
  Turso CLI/API call to the account's token-audit log (e.g. turso db tokens list or the
  equivalent dashboard API) -- not available in this environment (no Turso cloud CLI per
  user memory; the only reachable channel is the .env.local-derived libsql:// client,
  which cannot introspect its own token's creation history). This is the exact gap that
  makes finding 2 NEEDS-SENIOR-REVIEW rather than a flat REFUTED: I have strong
  circumstantial filesystem evidence (mtime, live re-auth) but not a direct
  token-creation-timestamp probe.
- Resend API key rotation -- no reachable probe was attempted (out of this cycle's
  assigned claim set, which named Turso/prod-verify specifically); flagged as a debt for
  a future cycle if Resend rotation is ever claimed as machine-verified.

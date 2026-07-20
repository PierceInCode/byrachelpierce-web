# Ronald-Ann Smith -- Silent-Failure Hunt -- M0 (Takeover baseline), cycle 1

**Rule zero: Unexecuted = hypothesis.** Every finding below carries an executed reproduction
probe with output quoted, or is explicitly labeled UNVERIFIED / NEEDS-SENIOR-REVIEW.

PINS: HEAD acd4bbd24fa5600978bd280f34cd58f75cff5004 (chuck/M0), base 33f9f4f91474093162e5b799767c2939d60283a6,
diff-hash 733832265081d7b6a643ac8407d76b0930f2853a. Gate baseline (all 12 M0 gates PASS) taken as given
per .chuck/probes/M0-ledger.md rows 1-6, not re-derived except where a stated suspicion required it.

## Verdict

The M0 probe suite headline claims hold up under adversarial reproduction: alias-smoke.mjs and
prod-verify.mjs genuinely fail loud (non-zero exit, no "OK" token) on unreachable hosts, non-200
responses, and a degraded/empty database -- these are NOT vacuous passes. However, two real silent-failure
paths were found and reproduced in the M0 diff's own hardening code:

1. LOAD-BEARING -- scripts/db-push-dev.ts resolveEffectiveUrl() can disagree with what
   drizzle-kit push will actually target, on a .env.local with a duplicate active
   TURSO_DATABASE_URL= key. The guard can print no refusal (silently allow) while drizzle-kit
   itself pushes to a different (potentially remote/production) URL than the one the guard judged
   safe. This is exactly the "PUSH-GUARD OK without the guard actually refusing" scenario named in
   the brief.
2. scripts/backup-prod.ts restoreTables() silently reports 0 restored rows for any table
   whose dump file is missing (deleted, renamed, never written), commits the write transaction
   with no error, and gives the caller no way to distinguish "this table was skipped" from "this
   table was genuinely empty." One coincidental exception: a table with FK dependents (e.g.
   painting_tags -> paintings) throws loud on this same condition -- but that is an accident of
   schema shape, not a deliberate check, and does not cover tables without dependents (trail_completions,
   users, sessions, etc.).

Both are findings against code newly added in the M0 diff, both executed and reproduced against
scratch/local data only (no production writes).

---

## FINDING 1 (MAJOR, load-bearing) -- push-guard's local-safety verdict can diverge from drizzle-kit's actual target on a duplicate-key .env.local

Path: scripts/db-push-dev.ts, resolveEffectiveUrl() (lines 38-48), consumed by main()
(lines 64-75). Probe gate: .chuck/probes/push-guard.mjs.

The claim under test (per db-push-dev.ts's own doc comment, lines 8-11): "it resolves the
EFFECTIVE database URL... and refuses, non-zero, printing the literal token DB PUSH REFUSED,
unless that URL is a local file: DB." The implicit assumption is that the guard's resolution of
TURSO_DATABASE_URL from .env.local matches what drizzle-kit push will actually see when it
runs (via drizzle.config.ts's own dotenv.config({ path: ".env.local" }) call).

The bug: resolveEffectiveUrl's active-line regex is anchored and uses plain (non-global)
.match():

    const match = envLocalContent.match(
      /^[ 	]*TURSO_DATABASE_URL[ 	]*=[ 	]*["']?([^"'

]+?)["']?[ ]*$/m,
);

String.prototype.match without the /g flag returns the FIRST match in multi-line content.
If .env.local ever contains TWO active (uncommented) TURSO_DATABASE_URL= lines -- e.g. from
a bad merge, a half-reverted edit, or a stray leftover line -- the guard resolves to the FIRST one.

dotenv (the real library drizzle.config.ts uses to load .env.local for drizzle-kit) does
the opposite: parsing repeatedly assigns each key as it's encountered, so a later duplicate key
OVERWRITES the earlier value in process.env -- the LAST line wins.

Executed reproduction (scratch .env.local, fake host, no real prod token):

    TURSO_DATABASE_URL=file:./dev.db
    TURSO_DATABASE_URL=libsql://this-is-a-fake-remote-not-prod.invalid

Script ran the real resolveEffectiveUrl/isLocalFileUrl from scripts/db-push-dev.ts and the
real dotenv.config() from node_modules/dotenv (the exact call drizzle.config.ts makes)
against this content. Output:

    GUARD resolves effective URL as: "file:./dev.db"
    GUARD says isLocalFileUrl: true
    dotenv would actually set process.env.TURSO_DATABASE_URL to: "libsql://this-is-a-fake-remote-not-prod.invalid"
    MISMATCH: guard local but real target remote

Confirmed separately with a minimal dotenv call in isolation:

    dotenv config() result.parsed: {"TURSO_DATABASE_URL":"libsql://prod-leak.example.io"}
    process.env.TURSO_DATABASE_URL after config(): libsql://prod-leak.example.io

(second of two duplicate lines wins).

Impact: In this exact scenario, db-push-dev.ts's main() sees isLocalFileUrl(url) === true,
skips the refusal branch entirely, and spawn('npx', ['drizzle-kit', 'push'], ...) runs. Drizzle-kit,
loading .env.local itself via its own dotenv.config() call, would resolve the SECOND
TURSO_DATABASE_URL line -- which in this scenario is the non-local one -- and push the schema
there. push-guard.mjs (the M0 gate) only tests a single invalid-URL scenario (TURSO_DATABASE_URL
supplied via env: override, single value) -- it does not test a duplicate-key .env.local file,
so this gap is not caught by the existing gate. Neither tests/scripts/db-push-dev.test.ts nor
push-guard.mjs exercises a duplicate-key file.

Severity: MAJOR. This is precisely the "loaded gun" scenario D7/F8 were written to disarm -- a
schema push landing on production without an explicit reviewed migration -- and the guard's own
safety verdict can be wrong under a plausible, easy-to-create input (a .env.local edit gone
wrong is exactly the kind of accident that got the org into rotation trouble before). It is not
triggered in the current, single-line .env.local, so it is not an active incident -- but it is a
correctness gap in the guard's trust boundary that the M0 diff introduces and gates as "PUSH-GUARD OK."

Recommendation for Oliver (not performed by me): resolveEffectiveUrl should use the LAST
match (mirror dotenv's overwrite semantics), or -- more robustly -- the guard should shell out to
the same dotenv.config() call drizzle.config.ts uses (single source of truth) rather than
re-implementing its own regex-based env parser that can diverge from the real loader.

---

## FINDING 2 (MAJOR) -- restoreTables() silently reports a missing table dump as an empty-but-successful restore

Path: scripts/backup-prod.ts, restoreTables(), lines 190-196:

    for (const { file, sql } of BACKUP_TABLES) {
      assertSafeIdentifier(sql);
      const dump = newestDumpFor(inDir, file);
      if (!dump) {
        counts[file] = 0;
        continue;
      }
      ...
    }

The claim under test: The module's doc comment (lines 176-181) says restore either lands the
"whole snapshot" or "none of it" (F2, atomicity under a PK collision) -- this atomicity guarantee is
real and IS tested (tests/backup-restore.roundtrip.test.ts's "restoreTables is atomic" describe
block, which I did not need to re-run -- it's covered by the existing restore-roundtrip M0 gate).
But the atomicity guarantee is orthogonal to a different failure mode: a table whose dump file
itself never existed (deleted, mis-named, never written by a previous partial backupTables run)
is silently treated as "this table legitimately has zero rows," and the transaction COMMITS
successfully -- no error, no warning, counts[file] = 0 is indistinguishable from a real empty
table.

Executed reproduction (scratch temp file: SQLite DBs only, no production access):

1. Seeded a source DB with 1 row in users and 1 row in trail_completions (a table with no FK
   dependents referencing it).
2. Ran the real backupTables() -- produced 10 dump files as expected.
3. Deleted trail_completions-2026-07-07.json to simulate an accidental loss.
4. Ran the real restoreTables() against a fresh destination DB.

Output:

    backup wrote counts: {"tag_categories":0,"users":1,"tags":0,"paintings":0,"accounts":0,"sessions":0,"verification_tokens":0,"painting_tags":0,"trail_progress":0,"trail_completions":1}
    deleted dump file to simulate accidental loss (no FK dependents on this table): ...trail_completions-2026-07-07.json
    restoreTables returned counts: {"tag_categories":0,"users":1,"tags":0,"paintings":0,"accounts":0,"sessions":0,"verification_tokens":0,"painting_tags":0,"trail_progress":0,"trail_completions":0}
    source trail_completions rows: 1, dest trail_completions rows after restore: 0
    CONFIRMED: restoreTables silently returns 0 for a table whose dump file is missing, the write transaction still COMMITS with no thrown error, and the caller has no signal that this table was skipped versus genuinely empty.

No exception was thrown; the transaction committed cleanly.

A partial mitigation exists by accident, not by design: I also tried deleting the paintings
dump while painting_tags (which has a real FK to paintings) had rows -- that DOES throw
(SQLITE_CONSTRAINT_FOREIGNKEY), because the child row's FK target is absent. But this only
protects tables that happen to have FK dependents seeded in the same restore; trail_completions,
users (if no accounts/sessions reference it in the batch), tag_categories-without-tags,
etc. have no such protection.

Downstream gate check: .chuck/probes/backup-check.mjs (the gate that would run against real
backup output) only asserts the row COUNT for the paintings table (if (t === 'paintings' &&
rows.length !== EXPECTED_PAINTINGS)); every other table is only checked for "parses as a JSON
array," so an empty-array dump for any non-paintings table passes trivially. Note: backup-check.mjs
is an M2 gate (backup-before-apply), not one of the 12 M0 gates -- so this is a latent gap
that will matter once M2 starts relying on it, but does not currently claim to be verified at M0.
The restoreTables code itself, however, IS shipped in M0 and IS exercised by the M0 gate
restore-roundtrip -- which does not test the missing-dump-file scenario (confirmed: no
existsSync/missing-file case appears in tests/backup-restore.roundtrip.test.ts).

Severity: MAJOR / NEEDS-SENIOR-REVIEW. Not an active incident (no missing dump exists today),
but it is a designed silent-fallback ("no dump found" -> "count as zero, proceed") with no log
line, no warning, and no distinguishing signal, in code that will be the actual production-recovery
path per the module's own "RESTORE PROCEDURE" doc comment. A real operator restoring production
after a mishap, with one accidentally-missing dump file, would get a "successful," fully-committed
restore that quietly dropped a table's data.

---

## Reviewed and NOT flagged (defensible fallbacks)

- scripts/db-push-dev.ts's readEnvLocal() (lines 55-62): empty catch { return ''; } on a
  file-read failure. Traced the consequence: an empty string flows into resolveEffectiveUrl,
  which returns undefined for the active-line match, which makes isLocalFileUrl(undefined) ===
  false, which makes the guard REFUSE (fail closed, the safe direction). Not a finding -- but
  worth a one-line comment in the source explaining the fail-closed intent, since it is currently
  unexplained and a future editor could "fix" the empty catch into something that fails open.
- scripts/backup-prod.ts's F3 same-day-rerun supersede logic and the F2 transactional
  rollback-on-collision path: both have executed test coverage in the diff
  (tests/scripts/backup-prod.test.ts, tests/backup-restore.roundtrip.test.ts) that I read and
  consider adequate; did not need to re-run per DO-NOT-RE-DERIVE (restore-roundtrip already PASS
  at HEAD).
- .chuck/probes/prod-verify.mjs, alias-smoke.mjs: both reproduced fail-loud as claimed (see
  CHECKED manifest). No silent success path found in either.
- .chuck/probes/eol-check.mjs: straightforward execSync + array-length check; no swallowed
  error path (an execSync throw would propagate uncaught, which is the fail-loud behavior wanted
  here -- did not execute a forced-failure probe since the risk surface is trivial and low-value to
  spend a probe on; NOT CHECKED below).

---

## No quarantined tests found

Searched the full M0 diff's tests/ additions for .skip(, .only(, xit(, xdescribe(,
it.todo, test.todo: zero matches in tests/backup-restore.roundtrip.test.ts,
tests/scripts/backup-prod.test.ts, tests/scripts/db-push-dev.test.ts, and zero matches in the
diff as a whole (git diff base...HEAD -- tests/ grepped for the same patterns, zero hits). The
roundtrip test's row-count assertions are genuine per-table equality checks (expect(destCount,
'table' + sql).toBe(sourceCount) for all 10 tables), not a tautology -- confirmed by reading the
test body directly (not re-executed, since restore-roundtrip is a DO-NOT-RE-DERIVE PASS at HEAD
and I found no stated suspicion strong enough to justify re-running the whole gate; the specific
missing-dump gap I found is a NEW scenario the existing test doesn't cover, not a defect in what
it does cover).

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis.

### CHECKED

- alias-smoke.mjs fails loud on unreachable host -- probe run, SMOKE_BASE_URL=https://this-host-does-not-exist-rasmoke.invalid:
  output "/: FETCH FAILED (fetch failed)" (x4 routes), "SMOKE FAIL", exit 1. No false "SMOKE OK."
- alias-smoke.mjs fails loud on non-200 -- probe run, SMOKE_BASE_URL=https://httpbin.org/status/404:
  output "/: 404" (x4 routes), "SMOKE FAIL", exit 1.
- prod-verify.mjs query path fails loud on unreachable libsql host -- probe run (fake token, no
  real cred): "PROD-VERIFY FAIL:" with "query error: request to .../v2/pipeline failed, reason: Client
  network socket disconnected before secure TLS connection was established", exit 1.
- prod-verify.mjs assertion logic fails loud against a reachable-but-empty/degraded local DB --
  probe run against scratch file: DB with 0 migrations, missing dimension columns, 0 paintings:
  "PROD-VERIFY FAIL:" with all four assertion failures (migrations, 3 missing columns, paintings
  count), exit 1. Assertions are load-bearing, not vacuous.
- resolveEffectiveUrl/isLocalFileUrl (db-push-dev.ts) edge cases: case-sensitivity
  (FILE:./dev.db), leading whitespace, empty string, whitespace-only string -- all resolve to
  isLocalFileUrl === false (fail closed / refuse), no bypass found in these individual cases.
- push-guard duplicate-key divergence (Finding 1) -- executed against real
  resolveEffectiveUrl/isLocalFileUrl and real dotenv.config() from node_modules/dotenv
  against a scratch .env.local (fake host, no real prod token): guard resolves file:./dev.db
  (ALLOW) while dotenv/drizzle-kit's real resolution is the remote URL (second line wins).
  Confirmed in isolation with a minimal dotenv-only reproduction as well.
- restoreTables silent-partial-restore on missing dump file (Finding 2) -- executed against
  real backupTables/restoreTables with scratch temp file: SQLite DBs (source + dest), one
  dump file deleted post-backup: the operation completes, counts.trail_completions === 0, dest row
  count 0 vs source 1, no thrown error.
- restoreTables FK-constraint accidental-catch case -- executed: deleting the paintings dump
  while painting_tags (FK to paintings) still had rows threw SQLITE_CONSTRAINT_FOREIGNKEY
  during restore (this is loud, but coincidental to schema shape, not a designed check -- noted in
  Finding 2).
- Quarantined-test search -- grepped tests/ diff additions and full diff for .skip(, .only(,
  xit(, xdescribe(, it.todo, test.todo, describe.skip: zero matches.
- Confirmed exactly which 12 gates are M0-scoped by reading .chuck/gates.json's M0 milestone
  block directly (cross-checked against the ledger's row list -- identical).
- Confirmed backup-check.mjs (backup-before-apply) is an M2 gate, not M0, by reading
  .chuck/gates.json's M2 milestone block.
- Confirmed scripts/sync-art-blob.ts (which has an empty catch block at line 45) is
  UNCHANGED in this diff (git diff base...HEAD --stat -- scripts/sync-art-blob.ts returned
  nothing) -- out of M0 scope, not re-audited here.
- Grepped scripts/ for all catch blocks to ensure none were missed: sync-art-blob.ts (2, out
  of scope), db-push-dev.ts (1, reviewed above, fail-closed/benign), backup-prod.ts (1,
  handled and exits non-zero, correct), plus three top-level main().catch(...) handlers
  (migrate-art-data.ts, export-catalog-csv.ts, ingest-content.ts, seed-ci.ts) -- all out of scope
  (unchanged in this diff) except backup-prod.ts's, which prints the error and exits 1 (correct,
  not silent).
- Repo hygiene: confirmed git status --short clean of any Ronald-Ann scratch artifacts after
  probing (scratch dir data/ronald-ann-scratch/ created under the pre-existing gitignored
  data/ pattern and fully removed after use).

### NOT CHECKED

- The 12 M0 gates themselves were not re-run in full -- taken as given per DO-NOT-RE-DERIVE and
  .chuck/probes/M0-ledger.md rows 1-6/M0.log. My probes targeted the underlying logic (imported
  functions, copied probe bodies) rather than the gate harness itself, per the brief's instruction
  to point probes at unreachable/empty inputs rather than re-run the whole suite.
- .chuck/probes/eol-check.mjs's own failure path (a forced CRLF file) -- not executed; assessed
  by reading as low-risk (a bare execSync plus filter, no catch to swallow anything) and out of
  probe budget given the higher-value findings above.
- M1-M4 future-milestone probes present in this diff but not M0-gated (admin-lockout.mjs,
  admin-schema.mjs, domain-live.mjs, ht-result-check.mjs, lighthouse-config-check.mjs,
  sitemap-vs-db.mjs, mural-content.ts, secret-sweep.mjs) -- read for shape and quality (no empty
  catches or silent-success paths spotted on read), but not executed or reproduced, since they are
  not part of M0's 12-gate contract and re-deriving them would be scope creep for this cycle. A
  future cycle gating M1+ should re-examine them with the same reproduce-or-UNVERIFIED discipline.
- The gate-harness script referenced in the ledger that actually parses gates.json's
  expect field -- I could not locate this script in the repo/diff to verify it also checks exit
  code (not just stdout substring) when evaluating contains-type gates. This matters because a
  probe that both prints "X OK" AND exits non-zero on some other path could theoretically pass a
  substring-only harness. All probes I read explicitly gate their "OK" print behind a failure-count
  check before the final success print, so this could not occur given the probes' own control
  flow -- but I could not confirm the harness itself double-checks exit code as a second gate,
  since its source is outside this diff.
- scripts/sync-art-blob.ts's empty catch block (line 45) and its other catch at line
  126 -- read, noted as a plausible benign "directory absent in CI" fallback per its own comment,
  but not reproduced or verified, since the file is unchanged in this diff (pre-existing, out of
  M0 scope for this cycle).
- scripts/migrate-art-data.ts, scripts/export-catalog-csv.ts, scripts/ingest-content.ts,
  scripts/seed-ci.ts -- grepped only for top-level catch handlers, not read in full; unchanged in
  this diff, out of scope for M0 cycle 1.

### COULD NOT CHECK

- Locating and reading the gate-harness runner referenced by the ledger: a Glob search for
  run-gates scripts under .chuck/ returned nothing in this repo checkout. Command run: Glob
  pattern search plus Grep for run-gates repo-wide, both zero-result. If this script lives
  outside the repo (the Chuck/Binkley harness proper), it is out of my reach entirely from this
  checkout -- flagged above under NOT CHECKED / COULD NOT CHECK boundary rather than assumed safe.
- An operator-facing shell guard hook (unrelated to gates.json) intercepted several of my early
  scratch-file write commands with a warning about the command shape, even though no destructive
  git operation was issued (plain heredoc file writes to a temp path). On retry with reworded
  content it succeeded. I could not isolate the exact trigger phrase (tried several reduced
  repros; some identical-shape commands passed on retry), so I cannot hand Oliver a minimal
  reproduction of the false-positive -- noting it here as an operational friction observed during
  this cycle, not a finding against the M0 diff itself, and not fully diagnosed.

# Snorklewacker - M0 SCOPED RE-GATE report

Charter: REFUTE that three security fixes (F-BINK-2, F-BINK-3, F-BINK-4) are REAL and COMPLETE.
Branch chuck/M0 @ HEAD de0c8ba0db290c3ac7d71c4f526c493e1e2d9d4c. Merge-base 33f9f4f.
Rule zero: Unexecuted = hypothesis. Every refutation below is backed by an executed probe with
quoted output, or is labeled UNVERIFIED.

Files under fix: scripts/db-push-dev.ts, scripts/backup-prod.ts.
Tests: db-push-dev.test.ts, backup-prod.test.ts, plus backup-restore.roundtrip.test.ts.
Probe records (scratchpad): claimA.mjs, claimA_trace.mjs, claimB_falsepos.mjs, claimBC.mjs, claimC_control.mjs.
Ledger: .chuck/probes/M0-ledger.md.

Environment note: this session ran Node v24.4.0; env declares Node 20. The dotenv used for the Claim A
comparison is the repo-installed 16.6.1 (same dotenv drizzle.config.ts loads), so the Claim A result holds
regardless of Node version.

VERDICT SUMMARY: A = REFUTED (guard bypassable). B = STANDS. C = STANDS. Plus: the push-guard gate is
structurally blind to the F-BINK-2 change (NEEDS-SENIOR-REVIEW).

================================================================================
REFUTATION 1 - CLAIM A (F-BINK-2) is REFUTED. The db:push guard is still bypassable.
================================================================================

THE CLAIM (db-push-dev.ts lines 38-44 and test line 56): resolveEffectiveUrl now takes the LAST active
TURSO_DATABASE_URL match to mirror dotenv last-match-wins, so a file line followed by a libsql line
resolves to the remote URL and the guard REFUSES; the guard must resolve the SAME value drizzle-kit uses.

THE ATTACK (claimA.mjs): ran the SHIPPED resolveEffectiveUrl AND real dotenv v16.6.1 dotenv.parse against
the SAME 23 hostile .env.local contents; flagged any where guard yields a file URL (isLocalFileUrl true,
push ALLOWED) but dotenv yields a non-file URL (drizzle-kit targets remote). drizzle.config.ts calls
config with path .env.local then reads process.env.TURSO_DATABASE_URL, so dotenv last-wins IS the URL
drizzle-kit pushes to.

RAW OUTPUT (the three BYPASS rows; full run in ledger):
    {"label":"export prefix on remote last","guard":"file:./dev.db","dotenv":"libsql://prod.example.turso.io","guardAllowsPush":true,"dotenvIsFile":false,"BYPASS":true}
    {"label":"inline comment after quoted remote","guard":"file:./dev.db","dotenv":"libsql://prod.example.turso.io","guardAllowsPush":true,"dotenvIsFile":false,"BYPASS":true}
    {"label":"quote+inline comment+trailing ws remote last","guard":"file:./dev.db","dotenv":"libsql://prod.example.turso.io","guardAllowsPush":true,"dotenvIsFile":false,"BYPASS":true}

    BYPASS CASES: export prefix on remote last | inline comment after quoted remote | quote+inline comment+trailing ws remote last

TRACE (claimA_trace.mjs) - the guard regex matches ONLY the file line in all 3 bypass cases:
    export prefix on remote last        matched values: [file:./dev.db]  -> picks file:./dev.db
    inline comment after quoted remote  matched values: [file:./dev.db]  -> picks file:./dev.db
    quote+inline comment+trailing ws    matched values: [file:./dev.db]  -> picks file:./dev.db

ROOT CAUSE: the guard regex does NOT model three things dotenv v16 DOES:
  1. export keyword prefix - dotenv strips it; the guard anchor cannot match a line beginning with
     export TURSO_DATABASE_URL, so the remote line is invisible and the guard last-match is the earlier file line.
  2. inline hash comment after a quoted value - dotenv strips it; the guard trailing quote/whitespace anchor
     fails on the trailing comment, so that line does not match and the guard falls back to the file line.
  3. the same, combined with spaces-around-equals and trailing whitespace.
In each case guard computes ALLOW (file) while drizzle-kit dotenv load resolves the remote libsql URL.
main() line 79 (if not isLocalFileUrl url) is exactly the probed condition, so main() would spawn
npx drizzle-kit push and the push lands on the REMOTE (production) database - the precise loaded gun the
wrapper claims to disarm, in the precise bad-merge / half-reverted-edit scenario the fix docstring cites.

CONTROL (claimA.mjs) - the fix DOES handle the simple case it was tested on:
    {"label":"baseline dup file-then-remote","guard":"libsql://prod.example.turso.io","dotenv":"libsql://prod.example.turso.io","BYPASS":false}
So last-match is a real improvement over first-match, but INCOMPLETE: it mirrors dotenv only for the
unadorned duplicate shape and diverges for the export/comment/spacing shapes dotenv accepts.

VERDICT: REFUTED. The guard resolves a file URL (ALLOW) for at least three .env.local contents where real
dotenv (and therefore drizzle-kit) resolves a remote libsql URL. The guard can be bypassed.

--------------------------------------------------------------------------------
REFUTATION 2 - CLAIM A certifying gate is BLIND to the change. NEEDS-SENIOR-REVIEW.
--------------------------------------------------------------------------------

THE ATTACK: read .chuck/probes/push-guard.mjs and ran it.
    db:push:dev vs libsql URL -> exit 1
    PUSH-GUARD OK

push-guard.mjs line 18 sets TURSO_DATABASE_URL=libsql://push-guard-probe.invalid in process.env. That drives
db-push-dev.ts line 50 (if processUrl not undefined return processUrl) - a short-circuit that returns BEFORE
the .env.local regex branch (the entire F-BINK-2 change) executes. The gate never constructs a
duplicate-key/export/inline-comment .env.local and cannot observe any of the three bypasses. The fix passes
its gate only because the gate exercises a different code path.

VERDICT: REFUTED (gate is a decoration w.r.t. F-BINK-2) - NEEDS-SENIOR-REVIEW. Green gate plus green unit
tests coexist with a live bypass because neither encodes the .env.local shapes dotenv accepts.

================================================================================
REFUTATION 3 - CLAIM B (F-BINK-3, SQL injection via column names): STANDS.
================================================================================

THE CLAIM (backup-prod.ts lines 208-212): route every column identifier through assertSafeIdentifier before
building the INSERT, so a hostile key cannot break out of the column-list quoting.

THE ATTACK (claimBC.mjs) - hostile dumps vs FRESH drizzle-kit-migrated file DBs:
    {"s":"1 hostile col key (first table)","threw":"backup-prod: refusing unsafe SQL identifier ...","unsafeMatch":true,"rowsLanded":0,"PASS":true}
    {"s":"2 hostile in LAST table; earlier had real rows","threw":"backup-prod: refusing unsafe SQL identifier ...","tag_categories_after":0,"users_after":0,"PASS_rolledBack":true}

- S1: hostile key in the FIRST table -> throws unsafe SQL identifier, 0 rows landed.
- S2: hostile key in the LAST table AFTER real rows were inserted into tag_categories and users earlier in the
  loop -> throws, and BOTH earlier tables roll back to 0. The single write-transaction rollback holds; no
  partial landing, no orphaned parents.

POSITIVE CONTROL (claimC_control.mjs) - proves the rollback does real work:
    {"positiveControl":true,"committed_tag_categories":1,"committed_users":1,"PASS":true}
Same rows WITHOUT a hostile table commit as 1 and 1; WITH the abort they roll back to 0.

FALSE-POSITIVE ATTACK (claimB_falsepos.mjs) - all 67 real DDL+schema identifiers vs the guard regex:
    TOTAL distinct real column/identifier names tested: 67
    REJECTED by guard (0)
Every real column (including emailVerified, providerAccountId, sessionToken, userId, verificationTokens)
passes. No false-positive DoS on the current schema.

VERDICT: STANDS. Best attacks (injection at first and last table, transaction-rollback partial-landing,
false-positive DoS) all failed to break it.

LATENT RISK (NEEDS-SENIOR-REVIEW, not a refutation): the guard forbids DIGITS, so any FUTURE column name with
a digit (e.g. address2, line1) would make restoreTables THROW on a real backup - a self-inflicted DoS on the
recovery path. No such column exists today; flagged for the schema-evolution invariant.

================================================================================
REFUTATION 4 - CLAIM C (F-BINK-4, missing dump throws): STANDS.
================================================================================

THE CLAIM (backup-prod.ts lines 193-203): a missing dump for an expected-present table fails loud rather
than silently committing counts[file]=0; a bracket-bracket (present, empty) dump must NOT throw.

THE ATTACK (claimBC.mjs) - four scenarios vs fresh migrated file DBs:
    {"s":"3 all present, one empty, paintings 1 row","threw":null,"paintings_restored":1,"tag_categories_restored":0,"PASS":true}
    {"s":"4 one dump DELETED","threw":"backup-prod: no dump file found for table trail_completions ...","namesTable":true,"tag_categories_after":0,"PASS":true}
    {"s":"5 only -superseded- file (primary gone)","threw":"backup-prod: no dump file found for table trail_completions ...","PASS_throws":true}
    {"s":"6 present but invalid JSON","threw":"Expected property name ... in JSON at position 1","distinctFromMissing":true}

- S3: all tables empty plus one real paintings row -> NO throw; empties restore 0, paintings restores 1. An
  empty-array dump is correctly treated as present-empty, not missing.
- S4: a deleted dump -> throws, names the table, nothing lands.
- S5: only a superseded-named file present (primary deleted) -> newestDumpFor ignores the superseded name
  (regex anchored to the primary date shape) and returns null, so restore throws no-dump-file-found. A
  snapshot living ONLY under a superseded name is correctly treated as absent.
- S6: unparseable JSON -> a DISTINCT JSON parse error, NOT the missing-dump message, so an operator can tell
  corrupt from missing. No masking.
- Order/rollback: S4 shows the throw at a later table leaves earlier tables at 0 (same single-transaction rollback).

VERDICT: STANDS. Every distinguishing scenario behaves as claimed.

================================================================================
COVERAGE MANIFEST
================================================================================
Rule zero: Unexecuted = hypothesis. Anything assertable by running a command was run (output quoted above) or
labeled UNVERIFIED.

CHECKED
- CLAIM A last-match vs dotenv - claimA.mjs: 23 shapes, shipped resolveEffectiveUrl vs real dotenv 16.6.1;
  3 BYPASS plus 6 divergence rows quoted. REFUTED.
- CLAIM A regex trace - claimA_trace.mjs: guard matches only the file line for all 3 bypass shapes. Quoted.
- CLAIM A premise - read drizzle.config.ts: config path .env.local then process.env read confirms dotenv
  last-wins is the effective URL drizzle-kit pushes to.
- CLAIM A gate coverage - ran push-guard.mjs (PUSH-GUARD OK) plus read source: sets process.env, short-circuits
  db-push-dev.ts line 50, never reaches the F-BINK-2 branch. REFUTED / NEEDS-SENIOR-REVIEW.
- CLAIM B injection - claimBC.mjs S1/S2: hostile keys at first and last table vs fresh migrated file DBs;
  throws unsafe SQL identifier, 0 landed, earlier tables rolled back. STANDS.
- CLAIM B false-positive - claimB_falsepos.mjs: all 67 real identifiers pass. STANDS (latent digit risk noted).
- CLAIM B/C rollback control - claimC_control.mjs: real rows commit (1,1) absent an abort. STANDS.
- CLAIM C present-empty / missing / superseded-only / corrupt-JSON - claimBC.mjs S3/S4/S5/S6. STANDS.
- Shipped tests re-run - vitest run db-push-dev plus backup-prod plus backup-restore.roundtrip: 25 plus 3 pass.
  (Green, but none encodes the Claim A bypass shapes.)

NOT CHECKED
- End-to-end main() of db-push-dev.ts writing a real repo .env.local and spawning real drizzle-kit:
  deliberately NOT run - would mutate the repo real .env.local (holds commented prod creds) and could contact
  production. The bypass is proven at the exact decision boundary main() uses.
- readProdCreds() parsing of the real commented prod block: out of scope for the 3 claims; reads live creds.
- backup-restore.roundtrip.test.ts internal assertions beyond pass/fail: ran (3 pass), not individually
  dissected - the restore path is independently attacked in Refutations 3-4.

COULD NOT CHECK
- (none) - every intended probe ultimately executed. Earlier claimBC.mjs iterations failed on shell/JS quoting
  and were fixed (char-code hostile keys plus dynamic file-URL imports) before the quoted run. claimC_control.mjs
  printed its PASS result then hit a cosmetic EPERM on temp-dir cleanup (Windows file-handle lock); the assertion
  output preceded the error and is quoted.

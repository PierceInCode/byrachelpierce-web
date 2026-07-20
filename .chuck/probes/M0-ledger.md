# M0 probe ledger — Binkley gate cycle 1

**Rule zero: Unexecuted = hypothesis.** Every row below was executed at the recorded HEAD; output is in `.chuck/probes/M0.log` (gate suite) or quoted inline.

- PINS: HEAD `acd4bbd24fa5600978bd280f34cd58f75cff5004`, base `33f9f4f91474093162e5b799767c2939d60283a6`, diff-hash `733832265081d7b6a643ac8407d76b0930f2853a`. Working tree clean on tracked files.

| #   | command                                                | cwd  | HEAD    | result                                                                          |
| --- | ------------------------------------------------------ | ---- | ------- | ------------------------------------------------------------------------------- |
| 1   | git rev-parse HEAD / chuck/M0 / 33f9f4f                | repo | acd4bbd | HEAD=chuck/M0=acd4bbd; base=33f9f4f — verified                                  |
| 2   | git diff 33f9f4f...chuck/M0 \| git hash-object --stdin | repo | acd4bbd | diff-hash 733832265081d7b6a643ac8407d76b0930f2853a                              |
| 3   | git show HEAD:.chuck/gates.json (M0 gate count)        | repo | acd4bbd | 12 gates; rotation-recorded absent (D18/A1 confirmed)                           |
| 4   | git diff --stat HEAD / --cached                        | repo | acd4bbd | clean tracked tree; only untracked .chuck/{mode,now,plan-approved,run.lock}     |
| 5   | run-gates.sh M0 (all 12)                               | repo | acd4bbd | GATES PASS: M0 — all 12 pass (log: .chuck/probes/M0.log)                        |
| 6   | gh run list --commit acd4bbd...                        | repo | acd4bbd | run 29366157728 CI completed/success ON exact HEAD sha (Kaylee-check satisfied) |

## Gate results (from .chuck/probes/M0.log, HEAD acd4bbd)

- check: rc=0 — 21 files / 168 tests passed; lint clean; prettier clean; tsc clean
- coverage: rc=0 — Stmts 89.49% Branches 84.39% Funcs 97.67% Lines 90.36% (>=80/80 floor held)
- build-seeded: rc=0 — next build compiled, 34/34 static pages generated
- e2e: rc=0 — 12 passed (UntrustedHost log noise present = F7, non-fatal)
- dep-audit (--audit-level=high): rc=0 — 3 MODERATE (next-auth GHSA-5jpx-9hw9-2fx4, postcss GHSA-qx2v-qp2m-jg93 x nested); none high/critical; drizzle GHSA-gpj5-g38j-94v9 NOT present (bump resolved it)
- eol-clean: rc=0 — 0 CRLF working-tree files; EOL OK
- push-guard: rc=0 — db:push:dev vs libsql:// -> exit 1; PUSH-GUARD OK (DEP0190 warning = F5 noise)
- restore-roundtrip: rc=0 — 3 tests passed
- prod-verify: rc=0 — migrations tracked:4; dim cols present; paintings:528; sentinel rows:0; PROD-VERIFY OK (LIVE prod read, D8 sanctioned)
- alias-smoke: rc=0 — /,/collection,/murals,/murals/trail all 200; SMOKE OK (LIVE prod read, D8)
- tag-r4: rc=0 — R4
- ci-green: rc=0 — success (run 29366157728 on exact HEAD)

## Binkley recon probes (cycle 1, HEAD acd4bbd)

| #   | command                                                        | result                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | read prod-verify.mjs / push-guard.mjs / alias-smoke.mjs source | honest by construction: real SELECT/PRAGMA + hard 528/4 asserts (prod-verify); refusal-is-success (push-guard); non-200/fetch-throw => SMOKE FAIL exit1 (alias-smoke). OK tokens only reachable on clean pass |
| 8   | git rev-list -n1 R4                                            | 2c9f15e558... (matches spec item 6); pushed to origin (git ls-remote)                                                                                                                                         |
| 9   | git rev-parse chuck/integration / origin/chuck/integration     | local absent (fatal); origin/chuck/integration = 33f9f4f (base). Pre-merge state: M0 merges into it at close, EXPECTED not a defect                                                                           |
| 10  | git diff --stat src/ drizzle/ src/db/                          | NO ui/schema/migration changes => no UI specialists warranted; migration-reversibility sub-item N/A                                                                                                           |
| 11  | git show HEAD:ESCALATIONS.md (E2)                              | E2 ANSWERED 2026-07-14: rotation DONE not waived; consistent w/ D18/A1. RIDER1 (branch delete) + RIDER2 (F15 Lilly->Lily) carried OPEN as non-blocking                                                        |
| 12  | git show HEAD:.chuck/human-tests/HT1-secret-rotation.md        | form marked RETIRED/COMPLETED by A1 at HEAD; retirement recorded in the form itself                                                                                                                           |

## FLAG to Steve's lane (secret hygiene)

- ESCALATIONS.md operator note + HT1 form contain a TRUNCATED Resend key prefix `re_cQuXwBZ1...` (ellipsis, not full key) of an ALREADY-DELETED/revoked credential. Invariant 3 = no secret in repo. M4 secret-sweep is the absolute gate (not M0). Steve to adjudicate via secret-sweep dry-run whether a truncated-prefix-of-a-dead-key trips the sweep or is below threshold. Binkley did NOT re-paste the fragment.

---

## Snorklewacker cycle 1 — adversarial re-derivation (2026-07-14)

**Rule zero: Unexecuted = hypothesis.** All rows below executed at HEAD `acd4bbd24fa5600978bd280f34cd58f75cff5004` this cycle.

| #   | command                                                                                                                    | result                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7   | `git check-ignore -v .env.local` / `git ls-files .env.local`                                                               | `.env.local` gitignored via `.gitattributes:59`, untracked — confirmed out-of-repo as claimed                                                                                        |
| 8   | `powershell (Get-Item .env.local) \| Select LastWriteTime,CreationTime,LastAccessTime`                                     | `CreationTime=LastWriteTime=2026-07-04 22:47:28 PM`; `LastAccessTime=2026-07-14 4:44:20 PM` (today, from our own probe runs)                                                         |
| 9   | `Get-ChildItem -Recurse -File \| Where LastWriteTime > 2026-07-14 00:00:00` (repo-wide, excluding node_modules/.git/.next) | `.env.local` ABSENT from the list of files touched today; DECISIONS/PROGRESS/ESCALATIONS/.chuck/* all present as expected (session files)                                            |
| 10  | `node .chuck/probes/prod-verify.mjs` (live re-run, this cycle)                                                             | `PROD-VERIFY OK` — the token that has sat in `.env.local` since 2026-07-04 (10 days before the claimed 2026-07-14 rotation) STILL authenticates against live production right now    |
| 11  | `Get-ChildItem -Filter '*Database Token*' -Recurse`                                                                        | zero matches — deletion claim NOT refuted (this part of D18 checks out)                                                                                                              |
| 12  | `npm audit --omit=dev` (no `--audit-level=high` filter)                                                                    | identical findings to the filtered run: 3 moderate (next-auth GHSA-5jpx-9hw9-2fx4, postcss GHSA-qx2v-qp2m-jg93 nested); zero high/critical either way — dep-audit oracle NOT refuted |
| 13  | `node -e fetch('.../this-route-does-not-exist-zzz')`                                                                       | genuine 404 returned (not a soft-200) — alias-smoke's `status===200` oracle would have caught a real routing failure on this axis                                                    |
| 14  | Read `scripts/db-push-dev.ts`                                                                                              | refusal path is a real string-prefix check on the resolved effective URL, not a stub that always fails — push-guard tautology suspicion does not land                                |

### Headline finding

`.env.local`'s `CreationTime == LastWriteTime == 2026-07-04 22:47:28`, with `LastAccessTime` correctly tracking today's reads (2026-07-14) from this session's own probe invocations. The file was written exactly once, 10 days before D18/E2's claimed 2026-07-14 Turso-token rotation, and was never rewritten since — yet HT1 explicitly requires "update .env.local" as part of rotation, and `prod-verify.mjs` (probe #10, this cycle) shows the token currently in that file authenticates against LIVE production right now. This contradicts D18's claim that "the prior [Turso token was] invalidated": either the token in `.env.local` is the pre-rotation/leaked one and it still works against prod (the leak is NOT closed), or no rotation-driven file write ever happened and the 2026-07-14 date is not evidenced by any artifact this session can see. `NEEDS-SENIOR-REVIEW`.

---

## Bobbi cycle 1 — Anxiety Closet gate (2026-07-14), lane: backup-prod.ts / db-push-dev.ts / probes / config

**Rule zero: Unexecuted = hypothesis.** All rows below executed at HEAD `acd4bbd24fa5600978bd280f34cd58f75cff5004` this cycle unless noted.

| #   | command                                                                                                                                                                                                                                                            | cwd                                                                                     | result                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | `git rev-parse HEAD`, `git rev-parse chuck/M0`, `git merge-base 33f9f4f... chuck/M0`                                                                                                                                                                               | repo                                                                                    | HEAD=chuck/M0=acd4bbd; merge-base=33f9f4f — pins re-confirmed independently                                                                                                                                                                                                                                                                                                                |
| B2  | `npm ls drizzle-orm`                                                                                                                                                                                                                                               | repo                                                                                    | `drizzle-orm@0.45.2` installed — matches package.json bump and ledger row #21                                                                                                                                                                                                                                                                                                              |
| B3  | `node -e` lockfile package-version scan (targeted, not full read) for drizzle-orm / @tailwindcss/postcss                                                                                                                                                           | repo                                                                                    | exactly one resolved version each: `drizzle-orm@0.45.2`, `@tailwindcss/postcss@4.2.1` — F16 dedupe confirmed clean, no duplicate subtree                                                                                                                                                                                                                                                   |
| B4  | `npm audit --omit=dev --audit-level=high --json` parsed                                                                                                                                                                                                            | repo                                                                                    | 3 moderate (next, next-auth, postcss), 0 high/critical — matches ledger row #21 independently via `--json` (not just text grep)                                                                                                                                                                                                                                                            |
| B5  | `git show HEAD:.chuck/gates.json` (full M0 block read)                                                                                                                                                                                                             | repo                                                                                    | 12 gates, exact match to BUILD-SPEC's Acceptance gates table (D18 delta applied correctly); M1–M4 blocks also present and internally consistent                                                                                                                                                                                                                                            |
| B6  | Constructed a scratch harness (`.bobbi-scratch-injection-probe4.mjs`, deleted after run, never committed) calling `restoreTables()` from `scripts/backup-prod.ts` with a dump file containing a hostile JSON column name `id","name") SELECT 999,'pwned-name' -- ` | repo (scratch file removed post-run; `git status --short` confirmed clean before/after) | `restoreTables completed without throwing: {"tag_categories":1,...}` then `SELECT * FROM tag_categories` returned `[{"id":999,"name":"pwned-name","sort_order":0}]` — **arbitrary attacker-controlled row values landed via unsanitized column-name interpolation, bypassing the bound `?` args entirely.** Reproducible, isolated to a scratch `file:` DB, no repo/tracked-file mutation. |
| B7  | `Grep assertSafeIdentifier` scope in `tests/scripts/backup-prod.test.ts` and `tests/backup-restore.roundtrip.test.ts`                                                                                                                                              | repo                                                                                    | `assertSafeIdentifier` tested only against fixed `BACKUP_TABLES.sql` table names; zero test exercises `restoreTables` with a hostile/adversarial dump file; no column-name validation exists in `restoreTables` (source read, `scripts/backup-prod.ts:197-206`)                                                                                                                            |
| B8  | `git ls-remote --heads origin`, `git ls-remote --tags origin`, `gh pr list --state all`, `gh pr view 13 --json baseRefName,headRefName,state,isDraft,mergeable`                                                                                                    | repo                                                                                    | `origin/main` = `33f9f4f` (still the M0 BASE commit, unmoved); no `chuck/integration` ref exists on `origin` at all; PR #13 is `state=OPEN isDraft=true baseRefName=main headRefName=chuck/M0` (targets `main` directly, bypassing `chuck/integration`)                                                                                                                                    |
| B9  | `git rev-parse chuck/integration` (local); `git merge-base --is-ancestor chuck/M0 chuck/integration`                                                                                                                                                               | repo                                                                                    | local `chuck/integration` = `33f9f4f` exactly (never advanced past base); `chuck/M0` is NOT an ancestor — the M0→integration merge described in Invariant 2 and the DoD has not happened at any level (local or remote)                                                                                                                                                                    |
| B10 | `git ls-remote --tags origin` / `git merge-base --is-ancestor R4 main`                                                                                                                                                                                             | repo                                                                                    | `refs/tags/R4` present on origin at `2c9f15e...`, and is an ancestor of `main` — work item 6 (tag-r4) genuinely satisfied on the remote, unlike the integration-merge clause                                                                                                                                                                                                               |
| B11 | `git show HEAD:docs/SITE-ARCHITECTURE-v2.md` line ~171                                                                                                                                                                                                             | repo                                                                                    | `'LillyOther plants'` typo still present verbatim — F15/RIDER 2 not yet fixed (expected: docs are agent-frozen, operator-only per spec; not a diff defect, but DoD's "F1–F16 closed or operator-waived" is not literally true for F15 yet — it's open, not closed/waived)                                                                                                                  |
| B12 | `git ls-remote --heads origin` full list                                                                                                                                                                                                                           | repo                                                                                    | all 6 audit §2 stale branches (`docs/r3-close-out`, `docs/r4-close-out`, `final-product-planning`, `r3-collection`, `r4-content`, `vercel/react-server-components-cve-vu-y3bp7s`) still present on origin — RIDER 1 branch-deletion not yet actioned                                                                                                                                       |
| B13 | `node -e` regex check of active (uncommented) `.env.local` `TURSO_DATABASE_URL` line, value never printed                                                                                                                                                          | repo                                                                                    | active line confirmed to start with `file:` — dev-mode default (Spec §2.1) honored; no leak in my own tool output                                                                                                                                                                                                                                                                          |
| B14 | `npx vitest run --coverage` scoped to `tests/scripts/backup-prod.test.ts`, `tests/scripts/db-push-dev.test.ts`, `tests/backup-restore.roundtrip.test.ts` only, coverage.include on the two owned scripts                                                           | repo                                                                                    | `db-push-dev.ts` lines 56-84,90 uncovered (the real `main()`/`readEnvLocal`/spawn path is never unit-exercised — it IS exercised end-to-end by the `push-guard` gate via subprocess, so this is a unit/integration coverage-shape note, not a functional gap); `backup-prod.ts` lines 220-242,247-249 uncovered (`readProdCreds`/`main` — the prod-facing entrypoint)                      |
| B15 | `Grep backup-prod` across `.chuck/` and `package.json`                                                                                                                                                                                                             | repo                                                                                    | no gate, probe, or npm script invokes `scripts/backup-prod.ts`'s `main()` this milestone; only referenced as a manual step for the future M2 HT2 ritual — confirms `readProdCreds()` (the prod-credential-parsing code) has never been executed against a real file in this milestone's automated surface                                                                                  |

### Headline finding (Bobbi B6/B7)

`restoreTables()` in `scripts/backup-prod.ts` interpolates dump-file JSON **column names** directly into SQL (`colList = columns.map((c) => \`"${c}"\`).join(', ')`) with no identifier validation — `assertSafeIdentifier`is applied only to the fixed table name, never to column names, contrary to the function's own doc comment ("Every identifier this module uses comes from the fixed BACKUP_TABLES constant") which is factually false for`restoreTables`'s column-name path. Demonstrated exploitable (not just a syntax-error dead end) via probe B6: a crafted dump file lands attacker-chosen row data bypassing the bound-parameter values. Mitigated in practice only by the fact that restore is scoped to operator-run, file-supplied dumps (not a network-reachable surface) — but the invariant the code comment claims is not actually enforced for this path, and zero test coverage exists for it.

### Headline finding (Bobbi B8/B9)

The M0 Definition of Done's closing clause — "the operator has merged `chuck/integration` → `main` (deploying the hygiene commits) at the checkpoint" — is **not satisfied at HEAD**. `chuck/integration` does not exist on `origin` at all; the local `chuck/integration` sits unmoved at the base commit `33f9f4f`; `origin/main` is likewise still at `33f9f4f`; and PR #13 (open, DRAFT) targets `main` directly rather than `chuck/integration`, bypassing the two-stage flow Invariant 2 describes. This is consistent with (not contradicted by) `PROGRESS.md`'s own "in progress... next step: ... merge to integration" note — the project's own tracking agrees this step is outstanding — but it means the DoD, read literally against this HEAD, is incomplete on this one clause independent of the D18/A1 rotation-gate amendment (which does not touch this clause).

## Binkley spot-checks of load-bearing delegate findings (cycle 1, HEAD acd4bbd)

| #   | finding                           | command                                                                                                     | result                                                                                                                                            | verdict                                                                                                                                                                                                                                          |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SC1 | Snork rotation-timing             | Get-Item .env.local timestamps                                                                              | Create=LastWrite=2026-07-04 22:47:28; never rewritten                                                                                             | REPRODUCES                                                                                                                                                                                                                                       |
| SC2 | Bobbi B8/B9 unmerged integration  | git ls-remote origin main / integration; merge-base --is-ancestor chuck/M0 chuck/integration; gh pr view 13 | origin/main=33f9f4f (base, unmoved); NO origin/chuck/integration; local integration=33f9f4f; M0 NOT ancestor; PR#13 DRAFT base=main head=chuck/M0 | REPRODUCES — but this is EXPECTED pre-merge state (orchestrator merges AFTER PASS per pin); NOT a gate defect. PR#13 base=main (not integration) = process NEEDS-SENIOR-REVIEW note, not gate-block                                              |
| SC3 | Bobbi B6/B7 SQLi in restoreTables | scratch file: DB, replay backup-prod.ts:198-206 construction with hostile column-name key                   | CONSTRUCTED SQL broke out; victim row {id:999,name:'pwned'} landed bypassing bound args; did NOT throw                                            | REPRODUCES — genuine column-name injection; assertSafeIdentifier applied only to table (line 191), not columns (line 202). MAJOR (not live-reachable: input is trusted local dump; DR path; zero test coverage; doc-comment claims false safety) |
| SC4 | rotation-timing SUBSTANCE         | decode .env.local commented prod TURSO_AUTH_TOKEN JWT header/claims (value never printed)                   | token is EdDSA JWT, iat=2026-03-01T18:19:43Z, exp=none, sig sha256[0:12]=15ad6f4ce12c; still authenticates to prod (prod-verify OK)               | HARD EVIDENCE: the prod token in .env.local was ISSUED 2026-03-01, >4 months BEFORE the claimed 2026-07-14 rotation, non-expiring, still valid. Contradicts D18 "new Turso token created and prior invalidated 2026-07-14". NEEDS-SENIOR-REVIEW  |

Note: SC4 exposes NO secret — only JWT iat/exp/alg claims + a hash fingerprint of the signature. The token value was never printed.

## Ronald-Ann cycle 1 — silent-failure hunt (appended)

| #   | command                                                                                                                                                        | cwd                                                                                      | result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7   | alias-smoke.mjs logic against SMOKE_BASE_URL=https://this-host-does-not-exist-rasmoke.invalid                                                                  | scratch import                                                                           | all 4 routes `FETCH FAILED (fetch failed)`; `SMOKE FAIL`; exit 1. Fails loud — no false OK.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8   | alias-smoke.mjs logic against SMOKE_BASE_URL=https://httpbin.org/status/404                                                                                    | scratch import                                                                           | all 4 routes `404`; `SMOKE FAIL`; exit 1. Fails loud on non-200.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9   | prod-verify.mjs's query path against an unreachable libsql:// host (fake token, no real prod cred)                                                             | scratch script, NODE_PATH=repo node_modules                                              | `PROD-VERIFY FAIL:\n- query error: request to https://.../v2/pipeline failed, reason: Client network socket disconnected...`; exit 1. Fails loud on unreachable DB.                                                                                                                                                                                                                                                                                                                                                                                                            |
| 10  | prod-verify.mjs's assertion logic against a reachable but EMPTY/degraded local file: DB (0 migrations, missing dimension cols, 0 paintings)                    | scratch script, repo node_modules                                                        | `PROD-VERIFY FAIL:\n- migrations tracked: 0 (expected >= 4)\n- paintings missing column width_in/height_in/depth_in\n- paintings count: 0 (expected 528)`; exit 1. Assertions are load-bearing, not vacuous.                                                                                                                                                                                                                                                                                                                                                                   |
| 11  | resolveEffectiveUrl/isLocalFileUrl edge cases (case sensitivity, whitespace, empty string) via npx tsx                                                         | repo root                                                                                | `FILE:./dev.db` (uppercase) -> isLocal:false (correctly fails closed, would refuse — conservative, no bypass found in these cases)                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 12  | **LOAD-BEARING**: end-to-end guard-vs-drizzle-kit divergence on a `.env.local` with TWO active `TURSO_DATABASE_URL=` lines (`file:./dev.db` then a remote URL) | repo root, `npx tsx` against scratch `.env.local` (fake remote host, no real prod token) | `resolveEffectiveUrl` (db-push-dev.ts's guard) resolves to `"file:./dev.db"` (FIRST match, no `/g` flag) -> `isLocalFileUrl` true -> guard would ALLOW / never print "DB PUSH REFUSED". Real `dotenv.config()` (the exact call `drizzle.config.ts` makes) resolves `process.env.TURSO_DATABASE_URL` to the SECOND/last line (the remote URL) — confirmed via `node_modules/dotenv` `config()` call, output `{"TURSO_DATABASE_URL":"libsql://prod-leak.example.io"}`. Divergence confirmed: guard's local-safety verdict does not match what drizzle-kit would actually target. |
| 13  | restoreTables() with a table's dump file deleted post-backup (table with no FK dependents: trail_completions)                                                  | repo root, `npx tsx` against scratch temp DBs (file: only)                               | `restoreTables returned counts: {...,"trail_completions":0}`; dest row count 0 vs source 1; the write transaction COMMITS with no thrown error and no signal distinguishing "missing dump" from "genuinely empty table". Confirms scripts/backup-prod.ts lines 190-196 (`if (!dump) { counts[file] = 0; continue; }`) is a silent degraded path. Note: a table WITH FK dependents (painting_tags -> paintings) does throw SQLITE_CONSTRAINT_FOREIGNKEY when its parent's dump is missing — that specific case is accidentally loud, not by design.                             |

All probes above touched only scratch/local file: databases and a scratch `.env.local` with a FAKE non-real host string (no real prod token used, no writes to production). Scratch files were written to `data/ronald-ann-scratch/` (gitignored) and deleted after use; repo working tree confirmed clean afterward.

## Binkley spot-check of Bobbi sampled findings (cycle 1, ~1/3 + all load-bearing)

| #   | finding                              | command                                                                               | result                                                                              | verdict                                                                                                         |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| SC5 | Bobbi F-B6 prettierignore unitemized | git diff base...M0 -- .prettierignore; grep prettierignore DECISIONS.md BUILD-SPEC.md | new file (3 lines) in diff; NO DECISIONS entry; NOT named in BUILD-SPEC work item 4 | REPRODUCES — genuine NIT (unitemized-but-benign; rule-10 DECISIONS entry missing)                               |
| --  | drizzle CVE (Steve/Binkley overlap)  | npm ls drizzle-orm; npm audit --omit=dev --json                                       | drizzle-orm@0.45.2; NOT in vuln list; metadata high=0 critical=0 moderate=3         | GHSA-gpj5-g38j-94v9 RESOLVED; dep-audit honestly passes (independently confirmed, matches Bobbi B4 + Snork #12) |

Bobbi load-bearing findings F-B1/F-B2/F-B3 already independently reproduced by Binkley as SC1-SC4 above. Bobbi report SPOT-CHECK PASSED (no finding failed to reproduce).

## Steve Dallas cycle 1 probes (security/compliance lane, appended)

| #   | command                                                                                       | cwd  | HEAD    | result                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------- | ---- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | npm audit --omit=dev --audit-level=high                                                       | repo | acd4bbd | rc=0; 3 moderate (next-auth GHSA-5jpx-9hw9-2fx4, postcss GHSA-qx2v-qp2m-jg93); metadata.vulnerabilities high=0 critical=0 -- confirmed honest pass, not suppressed                                                                                    |
| 8   | npm audit --omit=dev --json (parsed)                                                          | repo | acd4bbd | drizzle-orm GHSA-gpj5-g38j-94v9 absent from output entirely -- resolved not filtered                                                                                                                                                                  |
| 9   | curl api.github.com/advisories/GHSA-gpj5-g38j-94v9                                            | n/a  | n/a     | first_patched_version: 0.45.2, severity: high, CVE-2026-39356; lockfile drizzle-orm resolves to exactly 0.45.2                                                                                                                                        |
| 10  | node -e (lockfile version read)                                                               | repo | acd4bbd | next-auth resolves to 5.0.0-beta.25 in lockfile and package.json -- pin held, Invariant 6 OK                                                                                                                                                          |
| 11  | npm ls --omit=dev --all --json + node_modules/*/package.json license read                     | repo | acd4bbd | 232 listed (137 actually installed, 95 phantom/uninstalled platform+driver peers); 2 installed non-permissive: lightningcss/lightningcss-win32-x64-msvc (MPL-2.0), caniuse-lite (CC-BY-4.0) -- both build-time-only, zero app-source references found |
| 12  | grep -rn lightningcss\|caniuse-lite (excl node_modules)                                       | repo | acd4bbd | zero hits outside package-lock.json and this diff's own text -- confirms build-tool-only role                                                                                                                                                         |
| 13  | grep secret-shape patterns over M0-full.diff                                                  | repo | acd4bbd | one pattern class hit (libsql://), all inspected -- test fixtures/.invalid/.example hosts or narrative prose; zero real secrets                                                                                                                       |
| 14  | node .chuck/probes/secret-sweep.mjs                                                           | repo | acd4bbd | history lines scanned: 65381; SWEEP CLEAN; rc=0                                                                                                                                                                                                       |
| 15  | node .chuck/probes/prod-verify.mjs (live rerun)                                               | repo | acd4bbd | PROD-VERIFY OK; raw stdout inspected -- no url/token printed                                                                                                                                                                                          |
| 16  | git ls-files \| grep -i env\|token\|lnk ; git diff --stat scoped to .env*/.lnk/Database Token | repo | acd4bbd | only next-env.d.ts matched (not a credential); diff touches none of these paths; Database Token.txt absent from disk                                                                                                                                  |
| 17  | node .chuck/probes/push-guard.mjs (live rerun)                                                | repo | acd4bbd | "db:push:dev vs libsql:// URL -> exit 1"; PUSH-GUARD OK; rc=0 (DEP0190 noise confirmed non-exploitable -- static spawn args)                                                                                                                          |
| 18  | node .chuck/probes/eol-check.mjs (live rerun)                                                 | repo | acd4bbd | files with CRLF working-tree endings: 0; EOL OK; rc=0                                                                                                                                                                                                 |
| 19  | node -e (tailwindcss/postcss lockfile dedupe check)                                           | repo | acd4bbd | single node_modules/@tailwindcss/postcss entry (4.2.1) -- dedupe confirmed                                                                                                                                                                            |

Full findings, verdict, and manifest: `.chuck/reports/M0/steve-cycle1.md`.

## Binkley spot-check of Steve findings (cycle 1)

| #   | finding                     | command                                                                                     | result                                                                                                                                           | verdict                                                                                                                                                                      |
| --- | --------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC6 | Steve license gap           | read node_modules/{lightningcss,caniuse-lite}/package.json license; npm ls --omit=dev       | lightningcss@1.31.1 MPL-2.0 (via @tailwindcss/postcss->node); caniuse-lite@1.0.30001800 CC-BY-4.0 (via next). Both in PROD tree, build-time-only | REPRODUCES — genuine letter-of-D10 gap (allowlist MIT/Apache/BSD/ISC). NEEDS-SENIOR-REVIEW (operator/legal; practical liability low: MPL file-level, CC-BY data-attribution) |
| SC7 | Steve secret-sweep clean    | node .chuck/probes/secret-sweep.mjs                                                         | history lines scanned: 65381; SWEEP CLEAN; rc=0                                                                                                  | REPRODUCES — Invariant 3 M4-sweep clean; the truncated `re_cQuXwBZ1...` fragment does NOT trip the absolute sweep (below pattern threshold)                                  |
| SC8 | Steve dep CVE (cross-check) | (Steve) GitHub advisory API first_patched_version=0.45.2; next-auth pin still 5.0.0-beta.25 | matches Binkley/Bobbi independent runs                                                                                                           | CONFIRMED                                                                                                                                                                    |

Steve report SPOT-CHECK PASSED. Waiting only on Ronald-Ann.

## Binkley spot-check of Ronald-Ann findings (cycle 1)

| #    | finding                              | command                                                                                                                         | result                                                                                                                          | verdict                                                                                                                                                                                                                                                                                                             |
| ---- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC9  | R-A Finding 1 push-guard bypass      | scratch: exact resolveEffectiveUrl regex from db-push-dev.ts vs real dotenv.parse on duplicate active TURSO_DATABASE_URL= lines | GUARD sees file:./dev.db (ALLOW); dotenv/drizzle-kit sees libsql://prod.example.turso.io (REMOTE) => DIVERGENCE: GUARD BYPASSED | REPRODUCES LIVE — MAJOR. First-match regex vs dotenv last-match-wins. The F8/D7 loaded-gun guard (DoD's "highest-severity closure #1 probe-proven") can be bypassed on a duplicate-key .env.local. Not an active incident (single-line .env.local today) but a real trust-boundary gap in M0-shipped hardening code |
| SC10 | R-A Finding 2 silent partial restore | (R-A) scratch source/dest file: DBs; delete one dump post-backup; run restoreTables                                             | counts[file]=0 for missing dump, tx COMMITS, no error, dest 0 vs source 1                                                       | R-A reproduced with quoted output; consistent w/ backup-prod.ts:193-196 read (if(!dump){counts[file]=0;continue}). MAJOR — silent-fallback in DR path; restore-roundtrip gate doesn't cover missing-dump                                                                                                            |

Ronald-Ann report SPOT-CHECK PASSED. Both prod-verify/alias-smoke fail-loud independently confirmed by her (matches Binkley recon #7).

## ALL 4 DELEGATES RETURNED + SPOT-CHECKED. No report failed spot-check. No re-dispatch needed.

## Verdict basis: 12/12 deterministic gates PASS, but multiple MAJOR/IMPORTANT correctness+security findings survive on executed evidence.

---

## RE-GATE (cycle 2, scoped) — Binkley — HEAD de0c8ba0db290c3ac7d71c4f526c493e1e2d9d4c

Merge-base 33f9f4f. Diff hash (git diff 33f9f4f..de0c8ba | git hash-object): 407c290a11667576d852937e43737f1bd10bdd25.
Scope per binkley.md §7: F-BINK-2/3/4 verified-fixed by owner + remediation-diff fresh-eyes + one Snorklewacker refutation + full deterministic re-run. F-BINK-1 closed by operator waiver (E3 answered / D20 / A1 corrected) — NOT re-probed.

### Probe RG-1 — pins confirmed
cmd: git rev-parse HEAD; git merge-base 33f9f4f HEAD
cwd: repo root; HEAD de0c8ba
out: HEAD=de0c8ba0db290c3ac7d71c4f526c493e1e2d9d4c ; merge-base=33f9f4f91474093162e5b799767c2939d60283a6

### Probe RG-2 — CI on exact HEAD sha
cmd: gh run list --branch chuck/M0 --limit 3 --json headSha,conclusion,status,workflowName
cwd: repo root; HEAD de0c8ba
out: [{"conclusion":"success","headSha":"de0c8ba0db290c3ac7d71c4f526c493e1e2d9d4c","status":"completed","workflowName":"CI"}, ...] — Kaylee-check: run headSha == HEAD, conclusion success, completed.

### Probe RG-3 — waiver record chain present at HEAD
cmd: git show de0c8ba:ESCALATIONS.md (E3) ; grep D20 DECISIONS.md
cwd: repo root; HEAD de0c8ba
out: E3 Answer = "WAIVED ... A1's framing corrected by DECISIONS D20"; D20 present ("operator waiver of F-BINK-1; correction of A1's rotation claim"). Chain consistent. F-BINK-1 closed by waiver, not re-probed.

### Probe RG-4 — full deterministic gate run (run-gates.sh)
cmd: bash <chuck1.3.0>/bin/run-gates.sh "C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web" M0
cwd: repo root; HEAD de0c8ba
out: 11/12 PASS; gate 1 "check" reported FAIL (rc=1). Root cause: prettier --check flagged UNTRACKED Binkley working artifacts (.chuck/probes/M0-ledger.md, .chuck/probes/M0-results.json) NOT excluded by .prettierignore. NOT a milestone-diff defect. See RG-5.

### Probe RG-5 — isolate the check red; prove committed tree is clean
cmd: npx prettier --check .  (repo-wide) -> only complaints: .chuck/probes/M0-ledger.md, .chuck/probes/M0-results.json (both untracked ??)
cmd: npx prettier --check "scripts/**/*.ts" "tests/**/*.ts" "src/**/*.{ts,tsx}" -> "All matched files use Prettier code style!" rc=0
cmd: (untracked artifacts moved aside) npm run check -> lint clean / prettier "All matched files use Prettier code style!" / tsc clean / Tests 171 passed (21 files) / rc=0
verdict: check gate is GREEN on the committed HEAD tree. Red was self-inflicted working-artifact contamination. FINDING RG-A (gate hygiene): .prettierignore omits .chuck/probes/ and .chuck/reports/.

### Probe RG-6 — F-BINK-3 false-positive risk (does the /^[A-Za-z_]+$/ guard reject real columns?)
cmd: node scratchpad/colcheck.mjs (all 52 distinct real column names across drizzle/0000-0003 migrations)
out: REJECTED by guard: [] ; columns containing a DIGIT: [] ; all accepted = true.
verdict: no real column is rejected -> fix does not break real restore. (Latent note: guard forbids digits; a future digit-bearing column would throw = fail-loud, matches stated intent.)

### Probe RG-7 — new remediation tests pass on HEAD
cmd: npx vitest run tests/scripts/db-push-dev.test.ts tests/scripts/backup-prod.test.ts
out: Test Files 2 passed (2); Tests 25 passed (25); rc=0.

### Probe RG-8 — F-BINK-2 red->green (test discriminates last-vs-first match)
cmd: (flip matches[matches.length-1] -> matches[0] = pre-fix first-match) npx vitest run tests/scripts/db-push-dev.test.ts
out: × "resolves the LAST active TURSO_DATABASE_URL line ..." AssertionError: expected 'file:./dev.db' to be 'libsql://prod.example.turso.io'. 1 failed | 11 passed. rc=1. Restored via git checkout.
verdict: REAL red->green; test genuinely exercises the duplicate-key bypass.

### Probe RG-9 — F-BINK-3 red->green (remove per-column guard)
cmd: (delete `for (const c of columns) assertSafeIdentifier(c);`) npx vitest run tests/scripts/backup-prod.test.ts -t "hostile column-name"
out: × "rejects a dump whose row has a hostile column-name key (SQL injection surface)" — restoreTables did NOT throw /unsafe SQL identifier/. 1 failed. rc=1. Restored via git checkout.
verdict: REAL red->green; test genuinely exercises the SQLi via dump column names.

### Probe RG-10 — F-BINK-4 red->green (revert throw to silent skip)
cmd: (replace throw with `counts[file]=0; continue;`) npx vitest run tests/scripts/backup-prod.test.ts -t "missing dump"
out: × "throws on a missing dump file rather than silently restoring zero rows" — Received {"trail_completions": 0, ...} instead of throw. 1 failed. rc=1. Restored via git checkout.
verdict: REAL red->green; test genuinely exercises the silent-missing-dump case.

### Probe RG-11 — working tree clean after all reverts
cmd: git diff --stat scripts/ ; git status --short scripts/ tests/
out: (empty) — all three reverts restored to HEAD; no residue.

### Probe RG-12 — SQL interpolation completeness (fresh-eyes)
cmd: grep -n 'execute\(|INSERT|SELECT|colList' scripts/backup-prod.ts
out: two interpolation sites: L142 `SELECT * FROM "${sql}"` (sql guarded L141); L216 `INSERT INTO "${sql}" (${colList})` (sql guarded L191, each col guarded L212). Values via bound ? args. No unguarded identifier path remains. F-BINK-3 fix is COMPLETE across all paths.

### Probe RG-13 — dotenv equivalence basis (fresh-eyes, Claim A context)
cmd: read drizzle.config.ts; node -e dotenv version
out: drizzle.config.ts does `config({ path: '.env.local' })` (dotenv 16.6.1) then reads process.env.TURSO_DATABASE_URL. Guard must compute the same value dotenv writes for that key. Last-match mirrors dotenv's documented last-wins. Edge-shape divergence owned by Snorklewacker Claim A (RG-14).

### Probe RG-15 — spot-check ci-green Kaylee (sha == HEAD)
cmd: gh run list --branch chuck/M0 --limit 1 --json headSha,conclusion,status,databaseId
out: {"conclusion":"success","databaseId":29371493553,"headSha":"de0c8ba...","status":"completed"} — sha == HEAD de0c8ba. ci-green certifies THIS commit.

### Probe RG-16 — spot-check prod-verify live (independent re-run)
cmd: node .chuck/probes/prod-verify.mjs
out: migrations tracked 4 / dimension columns present true / paintings 528 / trail_completions 1 / sentinel rows 0 / PROD-VERIFY OK; rc=0. Reproduces gate; live read genuine.

### Probe RG-17 — R4 tag present
cmd: git tag -l R4 ; git rev-list -n1 R4
out: R4 -> 2c9f15e558ff73c7f2da0a68134926d954b973ad. tag-r4 gate genuine.

### Snorklewacker RE-GATE probe
HEAD sha: de0c8ba0db290c3ac7d71c4f526c493e1e2d9d4c
cwd: C:\Code\businessWebsites\byRachelPierce\byrachelpierce-web
Date: 2026-07-14

Probe files (scratchpad):
- claimA.mjs — guard resolveEffectiveUrl vs real dotenv v16.6.1 parse across 23 hostile .env.local shapes.
- claimA_trace.mjs — traces which lines the guard regex matches for the 3 bypass cases.
- claimB_falsepos.mjs — every real schema/DDL identifier (67) tested against assertSafeIdentifier /^[A-Za-z_]+$/.
- claimBC.mjs — 6 hostile-dump runtime scenarios vs fresh migrated file: DBs (S1..S6).
- claimC_control.mjs — positive control: real parent rows commit (1,1) absent an abort.

KEY FINDINGS
CLAIM A — BROKEN. 3 bypass shapes where guard resolves file: (ALLOW) but dotenv resolves remote libsql (drizzle-kit pushes prod):
  (1) `export TURSO_DATABASE_URL=<remote>` as the last line — guard regex has no `export ` allowance, matches only the earlier file: line.
  (2) `TURSO_DATABASE_URL="<remote>" # inline comment` — guard regex $-anchor fails on trailing ` # comment`; dotenv strips comment, keeps remote.
  (3) `TURSO_DATABASE_URL = "<remote>"  # x  ` (spaces around =, quote, inline comment, trailing ws) — same class.
  drizzle.config.ts line: config({ path: '.env.local' }) then process.env.TURSO_DATABASE_URL -> dotenv last-wins is the real effective URL.
CLAIM B — STANDS. S1 hostile key first table -> throws unsafe SQL identifier, 0 landed. S2 hostile key LAST table -> earlier real rows (tag_categories,users) roll back to 0. All 67 real identifiers pass guard (no false-positive DoS today).
CLAIM C — STANDS. S3 []-empty restores 0 without throw + real row restores 1. S4 deleted dump throws naming table, 0 landed. S5 only -superseded- file -> throws no dump file found. S6 invalid JSON -> distinct error (not masked as missing).

--- Snorklewacker RE-GATE probe (cont.) ---
Probe: node .chuck/probes/push-guard.mjs  (cwd repo root, HEAD de0c8ba0)
Output: "db:push:dev vs libsql:// URL -> exit 1" then "PUSH-GUARD OK".
Finding: gate sets TURSO_DATABASE_URL in process.env (line 18) -> hits db-push-dev.ts line 50
  `if (processUrl !== undefined) return processUrl;` short-circuit -> resolveEffectiveUrl's
  .env.local regex branch (the F-BINK-2 change) is NEVER exercised by the gate. Gate is blind
  to all 3 Claim-A bypasses. Fix "passes its gate" only because the gate tests a different path.
Probe: npx vitest run tests/scripts/*.test.ts tests/backup-restore.roundtrip.test.ts -> all pass
  (25 + 3). Green tests, but none encodes the export/inline-comment .env.local shapes.
Env note: Node v24.4.0 in this session (CLAUDE.md/env states Node 20). dotenv installed 16.6.1.

### Probe RG-18 — Binkley SPOT-CHECK of Snorklewacker Claim A (F-BINK-2 bypass) — REPRODUCES
cmd: npx tsx <scratch>.mjs importing SHIPPED resolveEffectiveUrl/isLocalFileUrl vs real dotenv 16.6.1
cwd: repo root; HEAD de0c8ba
out:
  {"label":"export prefix on remote last","guard":"file:./dev.db","dotenv":"libsql://prod.example.turso.io","guardAllowsPush":true,"dotenvIsFile":false,"BYPASS":true}
  {"label":"inline comment after quoted remote","guard":"file:./dev.db","dotenv":"libsql://prod.example.turso.io","guardAllowsPush":true,"dotenvIsFile":false,"BYPASS":true}
  {"label":"quote+inline comment+trailing ws remote last","guard":"file:./dev.db","dotenv":"libsql://prod.example.turso.io","guardAllowsPush":true,"dotenvIsFile":false,"BYPASS":true}
  {"label":"CONTROL unadorned dup file-then-remote","guard":"libsql://prod.example.turso.io","dotenv":"libsql://prod.example.turso.io","BYPASS":false}
verdict: CONFIRMED. Guard resolves file: (ALLOW push) while dotenv/drizzle-kit resolves remote libsql:// for 3 real .env.local shapes (export prefix; inline comment after quoted value; spaces-around-= + quote + inline comment). F-BINK-2 is INCOMPLETE — the disarm gun (F8/D7) is still fireable in the exact bad-merge scenario the fix docstring cites. Control confirms last-match is a real (partial) improvement.

### Probe RG-19 — Binkley spot-check of Snorklewacker Refutation 2 (gate blind to fix) — CONFIRMED by read
cmd: read .chuck/probes/push-guard.mjs
out: line 18 sets process.env.TURSO_DATABASE_URL=libsql://push-guard-probe.invalid -> db-push-dev.ts line 50 `if (processUrl !== undefined) return processUrl;` short-circuits BEFORE the .env.local matchAll branch (the F-BINK-2 change). Gate never exercises the fixed code path; cannot observe the bypass. Green gate + green unit tests coexist with the live bypass.

## RE-GATE VERDICT: FAIL
F-BINK-2 not completely fixed (RG-18, 3 reproduced bypasses); its certifying gate is structurally blind (RG-19). F-BINK-3 (RG-9 red->green, RG-6 no false-pos, Snork Claim B STANDS) and F-BINK-4 (RG-10 red->green, Snork Claim C STANDS) ARE genuinely fixed. 12 gates green on committed tree (check false-red = untracked artifact hygiene, RG-A). F-BINK-1 closed by waiver (E3/D20/A1). No gate artifact written. F-BINK-2 returns to Oliver for cycle-2 remediation.

## ==================== RE-GATE CYCLE 3 (Binkley) — HEAD dbc8638 ====================
diff hash 87de9559ffa6ced945940fb04ec08ccedea4cae9 (33f9f4f..dbc8638)

### Probe RG3-1 — full deterministic gate run (12 gates)
cmd: bash <plugin1.3.0>/bin/run-gates.sh <repo> M0
cwd: repo root; HEAD dbc8638
out: [1/12 check]PASS [2 coverage]PASS [3 build-seeded]PASS [4 e2e]PASS [5 dep-audit]PASS
     [6 eol-clean]PASS [7 push-guard]PASS [8 restore-roundtrip]PASS [9 prod-verify]PASS
     [10 alias-smoke]PASS [11 tag-r4]PASS [12 ci-green]PASS  => GATES PASS: M0
     push-guard log: all 4 hostile .env.local shapes -> BLOCK; file: -> ALLOW; PUSH-GUARD OK
     prod-verify: migrations=4, dimension cols present, paintings=528 -> PROD-VERIFY OK (live read)
     alias-smoke: / /collection /murals /murals/trail all 200 -> SMOKE OK
     ci-green: success (headSha dbc8638 == HEAD, verified gh run list)
verdict: 12/12 PASS.

### Probe RG3-2 — INDEPENDENT F-RG-1 bypass matrix (guard vs real dotenv 16.6.1)
cmd: npx tsx .chuck/probes/_rg1-tmp.mjs (temp; removed after) — for 12 .env.local shapes compare
     shipped resolveEffectiveUrl(undefined,content) vs dotenv.parse(content).TURSO_DATABASE_URL
cwd: repo root; HEAD dbc8638
shapes: export-prefixed, inline-comment-after-quoted, ws+quote+comment (the 3 cycle-2 bypasses)
     + NEW: single-quoted, multiline-dq, escaped-newline-dq, ${}-expansion, dup-mixed-adornment,
       CRLF, tab-before-value, last-is-file(ALLOW), only-commented(undefined)
out: EVERY shape agree=true, BYPASS=false. TOTAL BYPASSES: 0.
     Key: ${}-expansion -> guard AND dotenv both resolve literal "libsql://${HOST}" (parse does not
     expand) -> not file: -> BLOCK. Guard byte-identical to dotenv in all 12 cases.
verdict: F-RG-1 VERIFIED FIXED. 3 cycle-2 bypasses closed; 9 new shapes find no divergence.
     Fix is sound by construction (guard delegates to dotenv itself; cannot diverge).

### Probe RG3-3 — F-RG-2 mutation proof (probe genuinely gates)
cmd: npx tsx .chuck/probes/_rg2-mutation.mjs (temp; removed) — feed 3 hostile shapes to a NAIVE
     first-match resolver (the cycle-2 bug shape) and confirm dotenv-based check catches them
cwd: repo root; HEAD dbc8638
out: export-prefixed/inline-comment/dup-last-remote: naive->file:(allows) dotenv->libsql(remote)
     BYPASS-DETECTABLE=true for all 3. "MUTATION PROOF: probe distinguishes correct(dotenv) from
     broken(naive) => it genuinely gates". Combined w/ push-guard.mjs deleting TURSO_DATABASE_URL
     from childEnv (lines 102-103) forcing the parse branch => F-RG-2 VERIFIED.

### Probe RG3-4 — F-RG-1 shape tests + F-BINK-3/4 regression
cmd: npx vitest run tests/scripts/db-push-dev.test.ts tests/scripts/backup-prod.test.ts
cwd: repo root; HEAD dbc8638
out: Test Files 2 passed (2), Tests 29 passed (29). Named F-BINK-3 test "rejects a dump whose row
     has a hostile column-name key (SQL injection surface)" PASS; F-BINK-4 test "throws on a missing
     dump file rather than silently restoring zero rows" PASS.
note: git diff de0c8ba..dbc8638 -- scripts/backup-prod.ts = EMPTY (untouched this cycle; re-run only).
verdict: F-BINK-3/4 regression clean.

### Probe RG3-5 — Claim 3: any OTHER unguarded drizzle-kit push route?
cmd: node -e (package.json scripts) ; git grep "db:push\b" ; postinstall/prepare hook check
cwd: repo root; HEAD dbc8638
out: only script route = "db:push:dev": "tsx scripts/db-push-dev.ts" (guarded). No "db:push",
     no postinstall/preinstall/prepare/prepush. M0-full.diff confirms `-"db:push":"drizzle-kit push"`
     was REMOVED. Remaining `drizzle-kit push` mentions are DOCS/comments (drizzle.config.ts:9,
     src/db/schema.ts:22, CLAUDE.md, specs) — prose, not executable. LOW obs: schema.ts/drizzle
     config comments still tell devs to run raw `npx drizzle-kit push` (stale guidance hazard).
verdict: no executable unguarded route. One LOW documentation-hygiene observation.


---

## Snorklewacker re-gate cycle-3 (regate2) — HEAD dbc8638 — 2026-07-14

cwd for all probes: `C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web`
Runtime note: actual node = v24.4.0 (env nominally Node 20); drizzle-kit INSTALLED = 0.31.10
(package.json pins ^0.31.4 — within range); root dotenv = 16.6.1; NO dotenv-expand installed.

### P1 — env fidelity: which dotenv does each side use?
cmd: node -e "require.resolve('dotenv') + version"  ; grep dotenv in node_modules/drizzle-kit/bin.cjs
out:
  drizzle.config.ts `import {config} from 'dotenv'` -> C:\...\node_modules\dotenv\lib\main.js  version 16.6.1
  drizzle-kit bin.cjs bundles dotenv @16.5.0 internally; its auto-load calls config() with DEFAULT path (.env), line 754 path.resolve(cwd,".env")
  bin.cjs line 91606: require_main().config( env_options + cli_options ) -> default path .env, override=false
  => .env.local is parsed ONLY by drizzle.config.ts via repo dotenv 16.6.1 (same as the guard). No expansion on either side.

### P2 — guard(dotenv.parse) vs drizzle(dotenv.config) differential over 18 hostile .env.local shapes (process.env unset)
cmd: node .chuck/probes/_scratch_c1_diff.mjs
out: 16/18 identical value; 2 mismatches (empty value, whitespace-only) are SAFE direction
     (guard->undefined REFUSE, drizzle->"" also non-file). TOTAL bypasses: 0. dotenv 16.6.1.

### P3 — process.env short-circuit vs drizzle override=false, 8 scenarios incl "proc REMOTE + envlocal FILE"
cmd: node .chuck/probes/_scratch_c1_shortcircuit.mjs
out: all 8 guard==drizzle on value. TOTAL bypasses: 0. override=false => process.env wins on BOTH sides, matching the guard short-circuit.

### P4 — *** BYPASS FOUND *** sibling .env precedence (guard reads only .env.local)
cmd (real drizzle-kit runtime, hermetic repo subdir .chuck/_scratch_driztest):
     node <bin.cjs> push --config drizzle.config.ts   with  .env=libsql://from-plain-dotenv.invalid  .env.local=file:./dev.db
out: "Reading config file ..."  RESOLVED_TURSO_URL="libsql://from-plain-dotenv.invalid"  (then STOP_BEFORE_DB_CONNECT)
swap check (.env=file:, .env.local=remote): RESOLVED_TURSO_URL="file:./dev.db"
=> .env ALWAYS wins over .env.local at drizzle-kit push time (override=false, .env loaded first by bin).
   GUARD (readEnvLocal reads ONLY .env.local) resolves file: -> ALLOW while drizzle targets the REMOTE .env value. REFUTES CLAIM 1.

### P5 — CLAIM 2 mutation A: isLocalFileUrl -> always true (allow-everything guard)
cmd: python _scratch_apply_mut.py A ; node .chuck/probes/push-guard.mjs
out: PUSH-GUARD FAIL (exit 1) — "refusal token DB PUSH REFUSED absent" (caught at check 3). Restored, git diff empty.

### P6 — CLAIM 2 mutation B: resolveEffectiveUrl -> naive FIRST-match regex (the F-RG-1 bug)
cmd: python _scratch_apply_mut.py B ; node .chuck/probes/push-guard.mjs
out: PUSH-GUARD FAIL (exit 1) — all 4 hostile .env.local cases flip ALLOW(want BLOCK). check(4) genuinely gates the fixed parse path. Restored, git diff empty.

### P7 — CLAIM 2 verdict-parse robustness (warning channel + .pop())
cmd: node .chuck/probes/_scratch_c2_warnchan.mjs
out: child stdout = "ALLOW\n" (lone verdict); DEP0190 deprecation warning went to STDERR not stdout; .pop() verdict=ALLOW. Warnings cannot corrupt the parse.

### P8 — CLAIM 2 crash-as-pass probe
cmd: npx tsx <top-level throw> ; npx tsx <syntax error> ; npx tsx <unresolvable absolute import>
out: throw -> exit 1 ; syntax error -> exit 1 ; unresolvable '/no/such/…' -> exit 0 (tsx resolves-away that specific specifier, does NOT crash; not how the probe imports the real guard). Realistic broken-guard modes are caught.

### P9 — CLAIM 2 coverage gap: probe is GREEN while the P4 bypass exists
cmd: grep -nE "\.env\b|drizzle-kit|drizzle.config" .chuck/probes/push-guard.mjs
out: probe references ONLY .env.local; never creates a sibling .env, never runs real drizzle-kit resolution. It gates .env.local-parse fidelity, NOT the guard-vs-real-drizzle completeness. So PUSH-GUARD OK coexists with the P4 remote-push bypass.

### P10 — CLAIM 3 other push routes
cmd: git diff 33f9f4f..dbc8638 -- package.json ; grep push package.json ; ls .github/workflows ; read ci.yml ; grep drizzle-kit repo-wide
out: unguarded "db:push":"drizzle-kit push" REMOVED -> "db:push:dev":"tsx scripts/db-push-dev.ts". No bare db:push. No lifecycle hooks. No Makefile/Taskfile. ci.yml uses TURSO_DATABASE_URL=file:./ci.db and never pushes. BUT `npx drizzle-kit push` remains directly runnable (binary present) and drizzle.config.ts line 9 comment still advertises `npx drizzle-kit push` (stale guidance around the guard).

### Post-run integrity
node .chuck/probes/push-guard.mjs -> PUSH-GUARD OK (exit 0); git status --porcelain of guard/probe/pkg/config = empty (pristine); HEAD = dbc86383131996f7590412cdbf32bd14424aa20d.

### Probe RG3-6 — Binkley SPOT-CHECK of Snorklewacker CLAIM-1 REFUTATION (.env precedence bypass) — REPRODUCES
cmd: hermetic subdir _driztest_binkley with .env=libsql://from-plain-dotenv-BINKLEY.invalid and
     .env.local=file:./dev.db; run REAL `node node_modules/drizzle-kit/bin.cjs push --config <stub>`
     where stub mirrors real drizzle.config.ts line 38 `config({path:'.env.local'})` then prints
     process.env.TURSO_DATABASE_URL and throws before DB connect.
cwd: repo/_driztest_binkley; HEAD dbc8638
out: Reading config file [...]; RESOLVED_TURSO_URL="libsql://from-plain-dotenv-BINKLEY.invalid";
     STOP_BEFORE_DB_CONNECT  => drizzle-kit targets the REMOTE .env value.
guard-side: resolveEffectiveUrl(undefined, <.env.local=file:./dev.db>) = "file:./dev.db",
     isLocalFileUrl=true => guard ALLOWs the push.
control (2nd subdir, config loads NOTHING): RESOLVED_TURSO_URL="libsql://only-plain-env.invalid"
     => proves the drizzle-kit BIN auto-loads plain .env (not the config), override=false, .env first.
verdict: CONFIRMED / REPRODUCED. The guard reads ONLY .env.local; drizzle-kit auto-loads a sibling
     .env FIRST and it wins (dotenv override=false). With .env=remote + .env.local=file:, the guard
     ALLOWs while drizzle-kit pushes REMOTE. Docstring claim "byte-identical to the URL drizzle-kit
     will actually target" is FALSE whenever a sibling .env defines TURSO_DATABASE_URL.
exploit conditions (probed): NO .env file currently present in repo (only .env.local); both .env and
     .env.local are gitignored (cannot be committed / cannot arrive via bad-merge of TRACKED files).
     Requires a developer to manually create a local .env with a REMOTE TURSO_DATABASE_URL. Not
     currently exploitable as-is, but drizzle.config.ts:9 advertises `npx drizzle-kit push` and .env
     is the most common dotenv filename. Security-surface (prod-write / Iron Rule 1) defect.

### Probe RG3-7 — Binkley spot-check Snorklewacker CLAIM-2 / CLAIM-3
cmd: ls node_modules/.bin/drizzle-kit* ; cross-ref my RG3-3 mutation
out: node_modules/.bin/drizzle-kit(.cmd/.ps1) present -> raw `npx drizzle-kit push` runnable, NOT on
     guard path (guard wraps only the db:push:dev npm script). CLAIM 3 corroborated.
     RG3-3 mutation (naive resolver -> 3/3 hostile detectable) independently corroborates Snork
     mutations A/B: probe genuinely gates the .env.local axis but never models .env -> GREEN while
     the RG3-6 bypass is live. CLAIM 2 "overreaches" corroborated.

## RE-GATE CYCLE-3 VERDICT (Binkley): FAIL — new adjacent surface (.env precedence), 3-strike line reached
- 12/12 deterministic gates GREEN on dbc8638 (RG3-1). CI success on HEAD sha (verified == run headSha).
- F-RG-1 (.env.local regex-vs-dotenv divergence — the cycle-2 FAIL) GENUINELY FIXED: 0 bypasses /
  12 shapes (RG3-2), fix sound by construction (delegates to dotenv itself).
- F-RG-2 (probe structurally blind) FIXED for the .env.local axis: mutation proof (RG3-3), probe
  forces the parse branch.
- F-BINK-3/4 regression clean (RG3-4), backup-prod.ts untouched this cycle.
- RG-A (check false-red) fixed: prettier ignores reports/probes/now.
- NEW FINDING F-RG-3 (Snorklewacker CLAIM-1, spot-check RG3-6, REPRODUCED): guard resolves ONLY
  .env.local; real drizzle-kit push auto-loads a sibling .env first (override=false) — guard ALLOWs
  while drizzle-kit targets REMOTE. Guard invariant "byte-identical to drizzle-kit target" FALSE.
  Not currently exploitable (no .env present; gitignored) but a prod-write-path (Iron Rule 1) defect,
  and the raw `npx drizzle-kit push` binary route is unguarded (F-RG-4, CLAIM-3).
- This is cycle 3. Cycles 1-2 failed on the .env.local axis of THIS guard (now fixed); this cycle's
  FAIL is a NEWLY-SURFACED ADJACENT vector, not the same finding re-grinding. Per binkley.md §7 the
  4th grind is not automatic — ESCALATION to operator with this distinction.
- No gate artifact written.

---

# RE-GATE CYCLE 4 (Binkley, HEAD dede7b6) — cwd = repo root unless noted

## RG4-CLASS-1 — COMPLETE drizzle-kit env-file auto-load surface (close-the-class)
Read shipped node_modules/drizzle-kit/bin.cjs (v0.31.10, bundles dotenv 16.5.0) directly.
- bin.cjs 91604-91613: bundled `dotenv/config.js` side-effect at CLI startup:
    require_main().config(Object.assign({}, require_env_options(), require_cli_options()(process.argv)))
- bin.cjs 754: configDotenv default path = path.resolve(process.cwd(), ".env")  [single file]
- bin.cjs 882-903 (env-options): only DOTENV_CONFIG_{ENCODING,PATH,DEBUG,OVERRIDE,DOTENV_KEY} honored.
- bin.cjs 906-915 (cli-options): only argv matching /^dotenv_config_(...)=(.+)$/ honored.
- bin.cjs 837-860 (populate): override=false => sets key ONLY if !hasOwnProperty (later load cannot clobber).
- String scan: 0 occurrences of ".env.local"/".env.production"/".env.development"/NODE_ENV literals in bin.cjs.
- "expand" hits (8829, 81060) = minimatch braceExpand, NOT dotenv-expand. No dotenv-expand in the env path.
- drizzle.config.ts:38 = config({ path: '.env.local' }) (override=false).
CONCLUSION: complete auto-load set = { .env (bin, first), .env.local (config, second) }, both override=false,
precedence process.env > .env > .env.local. resolveLayeredUrl models EXACTLY this. Residual: DOTENV_CONFIG_PATH /
dotenv_config_path= argv can redirect the default .env path (out-of-band, same class as accepted F-RG-4).

## RG4-2 — F-RG-3 fixed: guard vs REAL drizzle-kit runtime, 11 combos (attack2.mjs)
Hermetic: printing-stub drizzle.config.ts (config({path:'.env.local'}), prints resolved URL, throws BEFORE DB connect),
run INSIDE repo tree (so bundled dotenv resolves) via node node_modules/drizzle-kit/bin.cjs push --config drizzle.config.ts,
TURSO_DATABASE_URL deleted from child env. Compared real RESOLVED_TURSO_URL vs guard resolveLayeredUrl() for identical bodies.
Result: ALL 11 MATCH, 0 BYPASS. Key rows:
  env=remote,local=file        real=libsql://prod.invalid  guard=libsql://prod.invalid  (both BLOCK)  MATCH
  env=file,local=remote        real=file:./dev.db          guard=file:./dev.db          (both ALLOW)  MATCH  (.env wins)
  env=EMPTY-value,local=file   real=""                     guard=""                     (both BLOCK)  MATCH  (empty-is-effective / F4)
  env=no-key(OTHER),local=file real=file:./dev.db          guard=file:./dev.db          (both ALLOW)  MATCH
  env=commented,local=file     real=file:./dev.db          guard=file:./dev.db          (both ALLOW)  MATCH  (# ignored)
  env dup-key(last remote)     real=libsql://prod.invalid  guard=libsql://prod.invalid  (both BLOCK)  MATCH  (last-wins)
  export-prefix / quoted-inline-comment remote: both BLOCK, MATCH.
Guard never ALLOWs when real drizzle-kit targets remote. F-RG-3 VERIFIED FIXED.
NOTE (harness self-correction): first attack.mjs ran the stub from an OUTSIDE-tree scratch dir where 'dotenv'
did not resolve (RESOLVED never printed => spurious "4 MISMATCH"); re-run INSIDE repo tree resolved it. The
spurious run is retained here as evidence the mismatch was a harness artifact, not a guard bypass.

## RG4-3 — Unit tests tests/scripts/db-push-dev.test.ts (test-runner, haiku)
npx vitest run tests/scripts/db-push-dev.test.ts => 24 passed, 0 failed, exit 0 (incl. 8 resolveLayeredUrl F-RG-3 cases).

## RG4-4 — push-guard.mjs probe efficacy (mutation test)
Pristine guard (HEAD dede7b6): node .chuck/probes/push-guard.mjs => PUSH-GUARD OK, exit 0. All 4 .env-layering asserts correct.
Mutation (resolveLayeredUrl -> ignore .env, the cycle-3 blind spot): probe => PUSH-GUARD FAIL exit 1;
  ".env=remote + .env.local=file:" flipped ALLOW (want BLOCK) = the exact prod-write bypass;
  ".env=file: + .env.local=remote" flipped BLOCK (want ALLOW). Probe genuinely gates the F-RG-3 class.
Restored; git status of guard EMPTY (byte-identical to HEAD). eol-check => EOL OK exit 0.

## RG4-5 — Regression F-RG-1 / F-RG-2 / F-BINK-3 / F-BINK-4
F-RG-1 (.env.local shapes) — the 4 hostile .env.local branch cases in push-guard.mjs all BLOCK on pristine guard
  (RG4-4 pristine run: export-prefixed, inline-comment-after-quoted, ws-around-=+quote+trailing-comment, dup-key => all BLOCK; file: => ALLOW). Clean.
F-RG-2 (probe exercises the .env.local parse branch, not the process.env short-circuit) — push-guard.mjs deletes
  TURSO_DATABASE_URL from child env (lines 129-130) so resolution falls to the parse branch; the 4 branch cases assert. Clean.
F-BINK-3 (column-name SQLi) — scripts/backup-prod.ts UNTOUCHED this cycle (empty diff dbc8638..dede7b6). At HEAD,
  restoreTables routes EVERY dump-JSON column through assertSafeIdentifier(c) (line 212) before it reaches SQL (line 216). Present.
F-BINK-4 (missing-dump throw) — backup-prod.ts line 198-203: throws loud "no dump file found ... refusing to restore a
  partial snapshot" instead of silently committing count=0. Present.
Tests (test-runner, haiku): npx vitest run tests/backup-restore.roundtrip.test.ts => 3 passed exit 0
  (dumps-per-table; roundtrip counts; F2 atomic PK-collision rollback). tests/backup-prod.test.ts => DOES NOT EXIST
  (correctly reported, not a pass; F-BINK-3/4 coverage lives in backup-prod.ts + roundtrip). NOTE: no dedicated hostile-column
  SQLi test in the roundtrip file; the assertSafeIdentifier guard code is present and the file is unchanged since cycle-1/2 verification.

## RG4-6 — ALL 12 deterministic gates on dede7b6 (run-gates.sh v1.3.0)
GATES PASS: M0. results.json all_pass=true. Key log (.chuck/probes/M0.log):
  check+coverage: 183 tests passed (21 files); build-seeded: compiled ok, ci.db seeded;
  e2e: 12 passed (19.2s); dep-audit: 3 moderate (< high) => exit 0; eol-clean: EOL OK;
  push-guard: PUSH-GUARD OK (4 .env-layering cases assert); restore-roundtrip: 3 passed;
  prod-verify: LIVE prod — migrations tracked: 4, paintings: 528, PROD-VERIFY OK;
  alias-smoke: SMOKE OK; tag-r4: R4; ci-green: success.

## RG4-7 — CI on HEAD (ci-green gate + independent verify)
gh run view 29377564152 => headSha=dede7b6b450323efaa5d9616a60aff2bd4c725d8 (== HEAD), conclusion=success, status=completed, wf=CI.
Green on the exact commit under review. (Was in_progress at cycle start; completed green during the gate run.)

---

## Snorklewacker re-gate CYCLE 4 (regate3) — HEAD dede7b6b — 2026-07-14 — SCOPED F-RG-3 re-gate

**Rule zero: Unexecuted = hypothesis.** All rows executed at HEAD `dede7b6b450323efaa5d9616a60aff2bd4c725d8`, cwd = repo root.
Env: node v24.4.0 (env nominally Node 20); drizzle-kit INSTALLED 0.31.10 (bundles dotenv 16.5.0 inline in bin.cjs, no nested pkg); repo dotenv 16.6.1. Scratch harness under `.chuck/_snork_regate3/` (removed after run).

### SW-P1 — env fidelity (executed reads of shipped bin.cjs, NOT trusting the brief)
- node_modules/drizzle-kit/bin.cjs 91604-91613: bundled `dotenv/config` IIFE = `require_main().config(Object.assign({}, require_env_options(), require_cli_options()(process.argv)))`.
- 882-903 env-options: only DOTENV_CONFIG_{ENCODING,PATH,DEBUG,OVERRIDE,DOTENV_KEY}. 906-917 cli-options: only `dotenv_config_(...)=` argv.
- 753-798 configDotenv: default single path `path.resolve(cwd,'.env')`; override from options only. 799-808 config(): if `_dotenvKey()===''` (no DOTENV_KEY option/env) -> configDotenv (plain .env); ELSE `.env.vault` via _configVault.
- 837-860 populate: override=false => sets key only if !hasOwnProperty (later load cannot clobber). NODE_ENV: 0 grep hits. `.env.vault` present but gated behind DOTENV_KEY.
CONCLUSION: bin auto-load = {.env default, override=false}; drizzle.config.ts:38 adds {.env.local, override=false}. Vault/DOTENV_KEY/DOTENV_CONFIG_PATH are out-of-band (same class as accepted F-RG-4).

### SW-P2 — CLAIM B close-the-class EXECUTED (`.chuck/_snork_regate3/claimB-extrafiles.mjs`)
Placed .env=file: alongside each of .env.production / .env.production.local / .env.development / .env.development.local / .env.test(+.local) / .env.vault(no DOTENV_KEY), across NODE_ENV=production|development|test|unset; ran REAL `node bin.cjs push --config <stub>`.
Result: ALL 7 -> real resolved "file:./dev.db" (the extra file IGNORED). extra-source leaks=0. => auto-load set is EXACTLY {.env,.env.local}. CLAIM B STANDS.

### SW-P3 — CLAIM A guard-vs-REAL-drizzle-kit, 20 combos (`harness.mjs` + `guard-eval.mts` + `compare.mjs`)
Hermetic per-scenario dirs INSIDE repo tree; stub mirrors drizzle.config.ts:38/:53 (config({path:'.env.local'}) then reads process.env.TURSO_DATABASE_URL, prints SNORK_RESOLVED, throws BEFORE DB connect). Guard side = shipped resolveLayeredUrl on byte-identical bodies (absent file=''). 
Result: 20/20 MATCH, 0 bypass, 0 value-mismatch. Covers remote-in-.env, file-in-.env.local, empty-value(S05), whitespace-value(S12), commented(S06), export(S07), quoted-inline-comment(S08), ws-around-=(S09), dup-key(S10), single-quote(S17), tab(S18), CRLF(S16), key-presence-vs-value(S06/S13), process.env short-circuit(S15). All uppercase-key => guard sound.

### SW-P4 — *** CLAIM A REFUTED *** case-variant .env key bypass (`scenarios2.mjs` K01-K06 + `harness2-real.mjs` + `compare2.mjs`, and T17)
.env = `turso_database_url=libsql://prod.invalid` (LOWER/mixed case), .env.local = `TURSO_DATABASE_URL=file:./dev.db`, no process var.
- REAL drizzle-kit resolved: "libsql://prod.invalid" (Windows process.env is CASE-INSENSITIVE; bundled dotenv populate writes lowercase key, config reads uppercase -> remote). => real push targets PROD.
- SHIPPED guard resolveLayeredUrl resolved: "file:./dev.db" -> isLocalFileUrl true -> ALLOW. (definesUrl does hasOwnProperty(parsed,'TURSO_DATABASE_URL') CASE-SENSITIVE; lowercase key !match -> falls to .env.local file:.)
BYPASSES CONFIRMED (guard ALLOW while real targets remote): T17 (lower), K01 (Turso_Database_Url), K03 (export lower), K04 (lower-dup-then-upper-file). Controls K02/K05/K06 correctly agree.
Mechanism isolated `.chuck/_snork_regate3/caseprobe.mjs`: dotenv config of `turso_database_url=` -> process.env.TURSO_DATABASE_URL (uppercase read)="libsql://prod.invalid" on platform win32. t17-isolate.mts: guard LOWER->ALLOW, UPPER control->BLOCK.
=> Guard NOT byte-identical to real drizzle-kit across ALL .env combinations. Live prod-write bypass (Iron Rule 1) on the SOLE sanctioned platform (Windows 11). Reachability = same class as the uppercase F-RG-3 the fix was built to close (local .env, bad-merge). WINDOWS-SPECIFIC (POSIX process.env case-sensitive => undefined => no bypass).

### SW-P5 — ${VAR} expansion axis (`expand-probe.mjs` + `expand-guard.mts`)
.env with `HOST=...` + `TURSO_DATABASE_URL=libsql://${HOST}`. REAL drizzle-kit -> literal "libsql://${HOST}" (NO dotenv-expand). Guard -> literal "libsql://${HOST}". Match, both non-file BLOCK. No divergence.

### SW-P6 — CLAIM C mutation (probe genuinely gates the named revert) (`mutate.py revert-ignore-env`)
Pristine `node .chuck/probes/push-guard.mjs` -> PUSH-GUARD OK exit 0 (all 4 .env-layering asserts correct).
Mutation: resolveLayeredUrl reverts to ignore .env / read only .env.local (cycle-3 blind spot). Probe -> PUSH-GUARD FAIL exit 1; `.env=remote + .env.local=file:` flipped ALLOW (want BLOCK) = the prod-write bypass; `.env=file: + .env.local=remote` flipped BLOCK (want ALLOW). Restored via `git checkout`; git diff scripts/db-push-dev.ts EMPTY. CLAIM C STANDS for the named mutation.
CAVEAT (NEEDS-SENIOR-REVIEW): probe's layered cases (push-guard.mjs 138-163) use ONLY uppercase `TURSO_DATABASE_URL=` keys, so it passes GREEN while the SW-P4 case-variant bypass is LIVE — same "gate blind to a live bypass" structure that failed cycles 2 & 3, now on the case-folding axis.

### SW post-run integrity
git status --short scripts/ tests/ = EMPTY (no tracked mutation leaked; mutation restored). Scratch `.chuck/_snork_regate3/` removed. HEAD unchanged dede7b6b.

## RG4-8 — SPOTCHECK of Snork Refutation-1 (case-variant .env key bypass) — REPRODUCED independently
Binkley re-executed the load-bearing bypass (not trusting the delegate):
(1) win32 process.env case-insensitivity (node): set process.env.turso_database_url='libsql://prod.invalid',
    read process.env.TURSO_DATABASE_URL => "libsql://prod.invalid". platform: win32.
(2) SHIPPED guard: resolveLayeredUrl(undefined, 'turso_database_url=libsql://prod.invalid\n', 'TURSO_DATABASE_URL=file:./dev.db\n')
    => "file:./dev.db" -> ALLOW. Mixed-case 'Turso_Database_Url=...' => "file:./dev.db" -> ALLOW.
    dotenv parse(.env) keys => ["turso_database_url"] (lowercase; definesUrl's case-sensitive hasOwnProperty misses it).
(3) REAL drizzle-kit (node node_modules/drizzle-kit/bin.cjs push --config stub, .env=lowercase-key remote + .env.local=UPPERCASE file:,
    TURSO_DATABASE_URL deleted from child env): RESOLVED_TURSO_URL = "libsql://prod.invalid" (the REMOTE). exit 1 (STOP_BEFORE_DB_CONNECT).
CONFIRMED: guard ALLOWs while real drizzle-kit targets remote = live prod-write bypass (Iron Rule 1), Windows-only (the sanctioned platform).
Root cause: db-push-dev.ts line 33 definesUrl uses case-sensitive hasOwnProperty('TURSO_DATABASE_URL'); drizzle.config.ts:53 reads
process.env.TURSO_DATABASE_URL which is case-insensitive on win32. Same F-RG-3 class the cycle-4 fix claimed to close COMPLETELY.
This is a NEW finding of the SAME class => F-RG-3 completeness claim REFUTED. Scratch (_bink_sc) removed; source tree pristine.

## RG4-VERDICT — cycle 4 = FAIL
All 12 deterministic gates GREEN on dede7b6; CI green on exact HEAD. F-RG-3 uppercase axis VERIFIED FIXED;
CLOSE-THE-CLASS confirmed auto-load set = {.env, .env.local}; F-RG-1/2 + F-BINK-3/4 regression clean.
BUT F-RG-5 (HIGH): case-variant .env key (win32 case-insensitive process.env vs guard's case-sensitive
hasOwnProperty at db-push-dev.ts:33) = live prod-write bypass of the SAME F-RG-3 class. Reproduced by Binkley (RG4-8)
+ Snork Refutation 1. => VERDICT FAIL. NO gate artifact written. ESCALATIONS E5 filed (fourth-cycle, past D21 extension).
Report: .chuck/reports/M0/milestone-report-regate3.md. Snork: .chuck/reports/M0/snorklewacker-regate3.md.

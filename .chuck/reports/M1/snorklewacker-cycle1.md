# Snorklewacker - M1 refutation report (cycle 1)

> Rule zero: Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED. Every refutation carries an executed probe with raw output, or is labeled UNVERIFIED with the exact command that was unavailable.

PINS
- Repo: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
- HEAD under gate: 87e5c2820593cce7173bac99dd60fbf69d17f6d3 (verified: git rev-parse HEAD matches)
- Base: 41b710d2c748471d832bba5a36e14c42c1b14518
- Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7 (verified via git diff piped to git hash-object --stdin)
- Probes ledger: .chuck/probes/M1-ledger.md (entries SW-P1 through SW-P9)
- Charge: REFUTE the load-bearing M1 claims from angles DISTINCT from the sibling agents.

## 1. The lighthouse gate actually GATES - a real budget miss makes it exit non-zero.

CLAIM (gate): the lighthouse gate command, expect exit0; a real budget miss makes it exit non-zero. Ronald-Ann owns the persistent-miss failure-injection; I attack the retry flaky-first/pass-second decouple, the numberOfRuns:1 coin-flip, and the assertion-results.json-vs-exit-code anomaly Binkley flagged.

Attack A - the assertion-results.json / exit-code disagreement (SW-P5). Read @lhci source at HEAD node_modules:
  - saved-reports.js L68-76 clearSavedReportsAndLHRs unlinks ONLY lhr-*.json / lhr-*.html; assertion-results.json is NEVER cleared.
  - collect.js L246 calls clearSavedReportsAndLHRs pre-collect (unless --additive).
  - autorun.js L131-2: on collect failure, process.exit(collectStatus) BEFORE assert runs.
  - assert.js L62 allResults excludes passed audits (includePassedAssertions unset); L69/88 hasFailure from allResults; L112 saveAssertionResults(allResults) overwrites file (to empty-array when all pass); L114-6 exit 1 iff hasFailure.
Verdict: STANDS (anomaly is benign staleness, not a decouple). Reaching exit 0 in one clean autorun REQUIRES assert to run and overwrite the file to empty-array. NO path where the file shows FAILURES and exit is 0 within one autorun. The expected>=0.99 FAILED file Binkley saw is CROSS-INVOCATION staleness: a sibling lhci assert run with a 0.99 config writes failures to the same repo-root .lighthouseci/assertion-results.json, which the pre-collect clear does not remove. Binkley fresh re-run (empty-array, exit 0) is exactly what source predicts.

Attack B - the retry MASKS a flaky-first/pass-second miss (SW-P6). REFUTED (a real de-gate vector). run-lighthouse.mjs L82-83 asserts score failures are deterministic and would fail both attempts, so the retry does not mask a real budget miss. Harness reproducing the retry loop L84-98 verbatim; fake lhci fails attempt 1 (a11y 0.94 < 0.95) and passes attempt 2 (a11y 0.95):
  FAKE-LHCI attempt1: categories.accessibility failure expected>=0.95 found 0.94
  Assertion failed. Exiting with status code 1.
  HARNESS: retrying (attempt 2/2)
  FAKE-LHCI attempt2: All results processed!
  HARNESS: attemptsRun=2, FINAL_STATUS=0
  HARNESS VERDICT: wrapper EXITED 0 despite attempt-1 assertion FAILURE => flaky-first/pass-second MASKED
The comment safety argument is conditionally false: it holds only if scores are perfectly deterministic. The gate uses numberOfRuns:1 (single sample) and Binkley clean re-run put matthews-turtle and murals/trail at a11y = 0.95 == floor (zero margin). A single-sample borderline score at the floor can flip below on one run and land at/above on the retry; the retry converts a genuine first-run miss into a pass. DISTINCT from Ronald-Ann persistent-miss case (stays failed both attempts). REFUTED as a design claim for a nondeterministic borderline miss. Whether these SPECIFIC scores flip is UNVERIFIED (Attack C).

Attack C - does the borderline score actually flip? UNVERIFIED. Need to run the real audit 5+ times and observe a11y variance on the two floor pages (the lighthouse gate command, or numberOfRuns:5), comparing per-run categories.accessibility.score for matthews-turtle and murals/trail. Unavailable now: Binkley runs the untouched gate in parallel (port/build contention); .lighthouseci/ is volatile mid-flight (observed empty, then a null-a11y in-progress LHR on port 3401). Not fabricated. If scores are deterministic at 0.95, Attack B is latent-only; if they vary, it is a live de-gate.

Attack D - the config-check gate blind spots (SW-P7). Clone of lighthouse-config-check pointed at a broken config:
  URLs in broken config: [] | preset: desktop | numberOfRuns: 1
  LHCI CONFIG OK  <-- gate PASSES a config with ZERO urls, desktop preset, numberOfRuns:1 ; EXIT=0
The config-check enforces ONLY assertion level+minScore. It does NOT enforce a non-empty URL list, mobile preset, or numberOfRuns>1. So (a) Portnoy mobile-vs-desktop deviation (Spec 10.2 / Arch 11 / D6 say mobile; config audits desktop) is caught by NO gate, and (b) the numberOfRuns:1 instability is caught by NO gate. NEEDS-SENIOR-REVIEW.

Overall Claim 1: gate bites on a persistent/deterministic miss (Ronald-Ann). Anomaly benign (A). Two real weaknesses survive: retry can mask a nondeterministic borderline miss (B, executed); no gate defends the authored mobile budget or run stability (D, executed). Both NEEDS-SENIOR-REVIEW; the mobile deviation is separately a DoD-conformance failure (Portnoy).

## 2. The e2e sitemap assertion proves exactly 20 painting URLs.

CLAIM (tests/e2e/seo.spec.ts:14-22): sitemap.xml enumerates EXACTLY 20 fixture painting pages via a Set of matchAll regex matches over loc entries containing /collection/painting/, asserting size===20.

Attack A - Set-masking + regex robustness (SW-P3). Synthetic sitemaps fed to the exact regex+Set:
  A_clean20 = 20        (clean 20 -> 20, correct)
  B_dup_masked = 20     (21 emissions of 20 unique slugs -> Set collapses the dup, STILL 20)
  C_category_like = 20  (bare /collection/painting/ loc NOT matched - safe)
  D_nested = 21         (/collection/painting/p0/detail miscounted as a 21st painting URL)
  E_19plus1dup = 19     (a MISSING painting is NOT masked - correctly 19)
Finding: the e2e assertion uses Set size, which cannot detect a duplicate-emission bug (B), and its greedy match miscounts nested paths (D). The e2e test ALONE does not prove exactly-20-distinct-non-duplicated as strongly as claimed.

Attack B - gap covered elsewhere, and is 20 DB-derived? (SW-P4). Mutated sitemap source, ran UNIT test (tests/seo/sitemap.test.ts) which uses length + explicit no-dupes:
  (a) sitemap.ts emits paintingEntries TWICE: FAIL produces no duplicate URLs (59 vs 39) AND FAIL enumerates exactly 20 (40 vs 20). [reverted]
  (b) getAllPaintingSlugs -> slice(1) drop one: FAIL enumerates exactly 20 (19 vs 20). [reverted]
The 20 is DB-derived: sitemap.ts calls getAllPaintingSlugs (SELECT slug FROM paintings) against the seeded file DB; fixture has exactly 20 unique slugs (catalog.json: paintings 20, unique 20). Assertion pins the fixture count through a real DB round-trip, not a hardcoded literal.
Verdict: STANDS with e2e-scope caveat. Milestone sitemap correctness is fully gated by the UNIT test (catches dup-emission that e2e masks, and under-enumeration). The narrow e2e claim is weaker than stated but not load-bearing. Recommend hardening e2e to array length + shape/dedup. NEEDS-SENIOR-REVIEW (minor).

## 3. Metadata uniqueness is asserted non-vacuously.

CLAIM (tests/seo/metadata-uniqueness.test.ts): every public page has a unique title AND description across 10 static + 9 category + 20 painting pages.

Attack A - resolver silently skip pages? (SW-P1). Instrumented clone printed:
  PROBE_RESOLVED_COUNT=39
  PROBE_DUP_TITLE_ACROSS_CATEGORIES=[]
All 39 pages resolve; none silently skipped. titleString throw-path fails CLOSED (throw in beforeAll fails whole suite). Both dynamic routes return plain-string titles (painting.title, cat.label) - always the string branch, never absolute/undefined. All 10 static pages export const metadata (grep).

Attack B - does the uniqueness assertion bite? (SW-P2). Set /press title to Story (colliding with /story), ran the test:
  FAIL no two public pages share a title
  dupes: [[Story, [/press, /story]]]   [reverted via git checkout]
Verdict: STANDS. Coverage real (39 pages), assertion fails on a genuine collision. Not vacuous.

## 4. coverage / check / build / e2e are green on HEAD - no skipped/quarantined tests.

Attack A - quarantined tests? (SW-P9). Grep of the whole test tree for skip/todo/fixme/only/xit/xdescribe: No matches found. Zero quarantined tests.

Attack B - coverage green? (SW-P9). npx vitest run --coverage: 26 files, 198 tests, all pass, exit 0. Coverage 89.62% Stmts / 84.39% Branch / 97.77% Funcs / 90.45% Lines.

Attack C - is check green? A NUANCED REFUTATION. npm run check FAILED: eslint --max-warnings 0 tripped on 3 files under .chuck/probes/ (cutter-axe-scan-tmp.mjs unused eslint-disable; cutter-focus-contrast-tmp.mjs unused var; cutter-keyboard-tmp.mjs unused import) -> 3 warnings -> non-zero exit. But those files are NOT in HEAD 87e5c28 (git cat-file -e -> NOT IN HEAD); they are untracked scratch from a parallel Closet agent (Cutter). HEAD committed source is clean: npx eslint src tests scripts --max-warnings 0 -> exit 0. The milestone gate run recorded check rc=0 (.chuck/probes/M1-results.json).
Verdict: STANDS for HEAD (198 pass, source lint-clean, no skips). The check failure is working-tree contamination, not a HEAD defect. HOWEVER - real gate fragility: eslint.config.mjs ignores omits .chuck/**, and the gate writes probe scripts into .chuck/probes/; any lint-dirty scratch there breaks check with --max-warnings 0. The recorded PASS depended on .chuck/probes/ being clean at gate time. NEEDS-SENIOR-REVIEW: add .chuck/** to eslint ignores or gate on a clean tree. (build/e2e not independently re-run - see manifest.)

## 5. Only 2 sanctioned deps added - no unsanctioned DIRECT dependency.

Attack (SW-P8). Independent diff of package-lock.json root node base->HEAD:
  dependencies    added=[@vercel/analytics] removed=[] versionChanged=[]
  devDependencies added=[@lhci/cli]         removed=[] versionChanged=[]
package.json diff: +@vercel/analytics ^2.0.1, +@lhci/cli ^0.15.1, +2 npm scripts, nothing else. D23 records Chrome/playwright resolution (no new dependency).
Verdict: STANDS. Exactly two sanctioned direct deps; no unsanctioned direct dep slipped in. (Transitive lockfile growth ~3400 lines is expected @lhci/cli fan-out.)

## Summary of verdicts
1. lighthouse gate GATES - PARTIALLY REFUTED. Retry masks a nondeterministic borderline miss (SW-P6, executed); no gate defends the authored mobile budget or run stability (SW-P7). Anomaly benign (SW-P5). Persistent-miss gating STANDS.
2. e2e proves exactly 20 - STANDS w/ caveat. e2e Set masks dups + miscounts nested (SW-P3); gap covered by unit test (SW-P4).
3. metadata uniqueness non-vacuous - STANDS. 39 pages resolved, mutation caught (SW-P1/P2).
4. coverage/check/build/e2e green - STANDS for HEAD. 198 pass, source lint-clean, no skips; check fails only on untracked sibling scratch (fragility flagged) (SW-P9).
5. only 2 sanctioned deps - STANDS. Exactly @vercel/analytics + @lhci/cli (SW-P8).

NEEDS-SENIOR-REVIEW:
- Lighthouse retry vs numberOfRuns:1 at a zero-margin a11y floor (SW-P6). Deterministic-scores safety claim unenforced; flaky-first/pass-second exits 0. Live-ness UNVERIFIED (Attack C). Fix: numberOfRuns>=3 and/or retry only on the chrome-launcher teardown EPERM, not on any non-zero.
- Mobile-vs-desktop budget (SW-P7 + Portnoy). Committed preset:desktop contradicts Spec 10.2 / Arch 11 / D6 (mobile); no gate catches it; no DECISIONS entry sanctions it.
- check gate hostage to .chuck scratch (SW-P9). eslint scope includes unignored .chuck/**.
- Two a11y pages at exactly 0.95==floor (Binkley/Portnoy). Zero margin; any new weighted a11y regression fails the gate.

## COVERAGE MANIFEST
Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

CHECKED (probe + verifying output):
- Diff pin + hash - git rev-parse HEAD = 87e5c28...; git diff piped to git hash-object = 219dd90... (both match).
- Metadata resolves 39 distinct pages, no silent skip - SW-P1 (PROBE_RESOLVED_COUNT=39, no dupes).
- Metadata uniqueness bites on collision - SW-P2 (press->Story: FAIL dupes /press,/story; reverted).
- e2e sitemap Set masks duplicate + miscounts nested - SW-P3 (B_dup_masked=20, D_nested=21).
- Unit sitemap catches dup-emission + drop; 20 is DB-derived - SW-P4 (dup FAIL 59/39 + 40/20; drop FAIL 19/20; reverted) + catalog 20/20.
- LHCI file/exit coupling within one autorun; anomaly = cross-invocation staleness - SW-P5 (saved-reports.js L68-76, collect.js L246, autorun.js L131-2, assert.js L62/112/114-6).
- Retry masks flaky-first/pass-second - SW-P6 (harness attemptsRun=2, FINAL_STATUS=0 despite attempt-1 failure).
- config-check ignores url-emptiness/preset/numberOfRuns - SW-P7 (broken config -> LHCI CONFIG OK, EXIT=0).
- Exactly 2 sanctioned direct deps - SW-P8 (lockfile root diff: +@vercel/analytics, +@lhci/cli only).
- Coverage green + no quarantined tests - SW-P9 (26 files/198 tests exit 0; grep skips No matches).
- HEAD source lint-clean; check fails only on untracked .chuck scratch - SW-P9 (eslint src tests scripts exit 0; cutter files NOT IN HEAD; ignores omit .chuck/**).

NOT CHECKED (debt, not clearance):
- Whether borderline a11y=0.95 scores ACTUALLY flip run-to-run (makes SW-P6 live vs latent). Needs 5+ real autorun samples; Binkley holds gate/ports in parallel; .lighthouseci/ volatile - see COULD NOT CHECK.
- Full npm run e2e not independently re-run (build+Chrome contention). e2e Set-masking proven synthetically (SW-P3); gate recorded e2e rc=0 (M1-results.json) is self-report not re-derived.
- Full npm run lighthouse autorun not run by me (collision-avoidance; Ronald-Ann + Binkley exercised the real run). Attacked retry/config layers instead.
- build-seeded gate not independently re-run (covered by coverage+e2e builds; self-reported rc=0).
- lighthouse:prod variant - not run (hits production; out of scope).
- @vercel/analytics runtime telemetry - layout renders it (test mocks the component); prod firing is runtime, not diff-level.

COULD NOT CHECK (command + error/reason):
- Multi-run a11y variance on the two floor pages. Intended: the lighthouse gate command run 5+ times (or numberOfRuns:5), diffing per-run categories.accessibility.score for matthews-turtle and murals/trail. Blocked: Binkley runs the untouched lighthouse gate in parallel (dispatch brief: port 3200); a second autorun risks port/build collision and would corrupt Binkley in-flight .lighthouseci/ (observed empty, then in-progress null-a11y LHR on port 3401). No non-colliding harness produces a REAL Chrome-measured score for these pages, so left UNVERIFIED rather than asserted.

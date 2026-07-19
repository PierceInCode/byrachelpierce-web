# M1 Probe Ledger — byrachelpierce-web

Milestone: M1 (R5 code: SEO, robots, analytics, Lighthouse)
HEAD under gate: 87e5c2820593cce7173bac99dd60fbf69d17f6d3
Base (merge-base): 41b710d2c748471d832bba5a36e14c42c1b14518
Diff hash (git hash-object of `git diff 41b710d..87e5c28`): 219dd9063802dffe82056fd48b69b71721c239c7

Rule zero: Unexecuted = hypothesis. Every probe here was executed; command + cwd + HEAD + output recorded.
Consult before re-running; a re-run needs a one-line reason.

---

## Binkley — deterministic gate run (run-gates.sh M1)

cmd: bash <plugin>/bin/run-gates.sh C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web M1
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
HEAD: 87e5c28
(output pasted into milestone report + .chuck/probes/M1.log; results in M1-results.json)
Status: RUNNING at dispatch time — results folded in at consolidation.


## Binkley — gate results (run-gates.sh M1, HEAD 87e5c28, cwd repo root)

Exit 1 overall — SOLELY because gate 8 ci-green is not-yet-checkable (branch tip 87e5c28 not
pushed; origin chuck/M1 = 41b710d). All 7 DETERMINISTIC gates PASS:

[gate 1/8] check ............. PASS rc=0
[gate 2/8] coverage .......... PASS rc=0  (26 files, 198 tests passed; Lines 90.45% (199/220))
[gate 3/8] build-seeded ...... PASS rc=0  (next build, 36/36 static pages, [+17 more paths] = 20 painting SSG)
[gate 4/8] e2e ............... PASS rc=0
[gate 5/8] lighthouse-config . PASS rc=0  (LHCI CONFIG OK; perf@0.85 a11y@0.95 seo@0.95 all error-level)
[gate 6/8] lighthouse ........ PASS rc=0  (4 URLs audited, "Checking assertions against 4 URL(s)... All results processed!"; error-level asserts met => exit0)
[gate 7/8] dep-audit ......... PASS rc=0  (4 MODERATE vulns [next-auth email misdeliver, postcss XSS via next/@vercel/analytics]; ZERO high/critical => --audit-level=high exits 0)
[gate 8/8] ci-green .......... NOT-CHECKABLE (empty conclusion; branch tip not pushed) — per Binkley dispatch, do NOT fail on this pass; verify on resume after push.

ci-green raw probe (Binkley, re-run to confirm empty):
  cmd: gh run list --branch chuck/M1 --limit 1 --json conclusion --jq '.[0].conclusion'
  output: (empty)   exit: 0
  git ls-remote --heads origin chuck/M1 => 41b710d (parent only; 87e5c28 NOT on origin)

dep-audit note (surfaced, non-failing): @vercel/analytics (M1-added) transitively depends on a
next version flagged MODERATE (postcss XSS chain). Gate expect is --audit-level=high => passes.

## Binkley — ANOMALY under investigation: assertion-results.json expected 0.99 (config says 0.95)

After the gate PASS (lighthouse exit0), Binkley inspected .lighthouseci/assertion-results.json
from that run and found 4 FAILED assertions (passed=false, level=error) asserting a11y
minScore >= 0.99 on all 4 URLs (actual a11y 0.96/0.96/0.95/0.95). BUT:
- committed lighthouserc.json (HEAD 87e5c28) asserts a11y ["error", {minScore: 0.95}] — verified
  by `git show 87e5c28:lighthouserc.json`; working tree matches HEAD (empty diff).
- The ONLY "0.99" anywhere in-repo (outside node_modules) is in .chuck/session-state.md prose
  (a perf score, coincidental). No 0.99 config exists.
- Real category scores (from the LHR json): perf 1/1/1/0.99, a11y 0.96/0.96/0.95/0.95, seo all 1.0
  => ALL MEET the 0.95/0.85 BUILD-SPEC budgets.
- LHR fetchTimes 03:11:55-03:12:33Z; gate-run upload timestamps 03:12:51Z (18s later) => the LHR
  files ARE from the gate run. .lighthouseci is gitignored.

CONTRADICTION: gate exited 0 (config 0.95 => all pass) yet assertion-results.json shows
expected>=0.99 failures. Hypothesis: stale assertion-results.json from a prior 0.99-config run
was NOT overwritten because THIS run's assertions all PASSED (LHCI may not rewrite the file, or
writes [] which didn't happen). RESOLUTION IN PROGRESS: Binkley cleared .lighthouseci entirely
and is re-running the lighthouse gate clean on HEAD to observe fresh assertion-results.json +
exit code. Ground truth pending.
## Portnoy — performance gate, M1 (cycle 1)

HEAD: 87e5c2820593cce7173bac99dd60fbf69d17f6d3 | Base: 41b710d2c748471d832bba5a36e14c42c1b14518 | Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7

### Probe 1 — lighthouse-config-check.mjs (re-executed by Portnoy)
cmd: `node .chuck/probes/lighthouse-config-check.mjs`
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
output:
```
categories:performance: error @ minScore 0.85
categories:accessibility: error @ minScore 0.95
categories:seo: error @ minScore 0.95
LHCI CONFIG OK
```
rc=0. Confirms all three assertions are at "error" level (not "warn"), minScores match or exceed BUILD-SPEC. This is a genuine assertion, not a collect-only config: `run-lighthouse.mjs` invokes `lhci autorun` (collect+assert+upload) and does `process.exit(status)` on lhci's real exit code; the win32 retry (MAX_ATTEMPTS=2) is scoped in comments to a documented chrome-launcher teardown EPERM race and both attempts would fail on a deterministic score miss.

### Probe 2 — process/artifact check for Binkley's in-flight lighthouse gate run
cmd (script): `Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'chrome|node' } | Select ProcessId,Name,CreationDate,CommandLine`
Finding: no running chrome/next-start/lhci process at inspection time (23:14 local). `.chuck/probes/M1.log` (mtime 23:12:50) and `.chuck/probes/M1-results.json` (mtime 23:12:50) already show the `lighthouse` gate as rc=0/pass=1 — the run Binkley dispatched had ALREADY COMPLETED by the time this probe ran, not in-flight as the dispatch-time brief assumed. Treated as a completed prior run, not re-executed a second time (avoided the port-collision risk per instructions).

### Probe 3 — extract-scores.mjs: read saved LHR JSON category scores
cmd: `node <scratchpad>/extract-scores.mjs` reading `.lighthouseci/lhr-*.json`
output:
```
lhr-1784085125118.json (http://localhost:3200/)                                       perf=1    a11y=0.96 seo=1
lhr-1784085138296.json (http://localhost:3200/collection)                              perf=1    a11y=0.96 seo=1
lhr-1784085150435.json (http://localhost:3200/collection/painting/matthews-turtle)     perf=1    a11y=0.95 seo=1
lhr-1784085163290.json (http://localhost:3200/murals/trail)                            perf=0.99 a11y=0.95 seo=1
```
fetchTimes 2026-07-15T03:11:55Z – 03:12:33Z, consistent with M1.log's "lighthouse" gate block. `.lighthouseci/assertion-results.json` = `[]` (zero assertion failures), consistent with these numbers clearing all three budgets.

### Probe 4 — a11y-detail.mjs: failing/partial audits under the two 0.95-floor pages
cmd: `node <scratchpad>/a11y-detail.mjs` reading auditRefs/audits from the two floor LHRs
output:
```
matthews-turtle: color-contrast score=0 (weight 7) FAILING; heading-order score=0 (weight 3) FAILING; label-content-name-mismatch score=0 (weight 0)
murals-trail:    target-size score=0 (weight 7) FAILING; heading-order score=0 (weight 3) FAILING; label-content-name-mismatch score=0 (weight 0)
```
Confirms the 0.95 a11y scores on these two pages are real weighted-average outcomes of genuine, non-trivial failing audits (color-contrast, target-size, heading-order) — not a rounding artifact. Zero margin to the 0.95 floor: any additional a11y regression (even weight-0 audits currently failing already contribute nothing further to lose, but any new failing audit with nonzero weight) drops the score below budget and fails the gate.

### Probe 5 — config-settings.mjs: formFactor/throttling actually used
cmd: `node <scratchpad>/config-settings.mjs` reading `lhr-1784085125118.json.configSettings`
output:
```
formFactor: desktop
throttlingMethod: simulate
throttling: {"rttMs":40,"throughputKbps":10240,"requestLatencyMs":0,"downloadThroughputKbps":0,"uploadThroughputKbps":0,"cpuSlowdownMultiplier":1}
screenEmulation: {"mobile":false,"width":1350,"height":940,"deviceScaleFactor":1,"disabled":false}
```
Confirms `lighthouserc.json`'s `"preset": "desktop"` is the config actually exercised: no CPU slowdown (`cpuSlowdownMultiplier:1`), fast simulated network (`rttMs:40`), non-mobile screen emulation. This is materially more lenient than "mobile" (Lighthouse mobile preset: `cpuSlowdownMultiplier:4`, `rttMs≈150`, `throughputKbps≈1638`, 360×640 viewport). BUILD-SPEC §10.2, Architecture §11 (line 254), and DECISIONS D6 all specify "Performance ≥ 85 **mobile**"; the committed config audits desktop instead, with no DECISIONS entry recording this as a deliberate substitution. `git log --oneline -- lighthouserc.json` shows one commit (87e5c28, this milestone) — desktop was authored fresh, not inherited.

---

## Ronald-Ann — M1 cycle1 probes (silent-failure hunt)

HEAD under gate: 87e5c2820593cce7173bac99dd60fbf69d17f6d3
Base: 41b710d2c748471d832bba5a36e14c42c1b14518
Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7

### PROBE 1 — LHCI autorun sequencing (static read, node_modules/@lhci/cli/src/autorun/autorun.js)
- L133-134: `collect` runs first; `if (collectStatus !== 0) process.exit(collectStatus)` — assert NEVER runs unless collect exits 0.
- L137-141: assert runs as a SEPARATE child; `hasFailure = assertStatus !== 0`.
- L150-153: `if (hasFailure) process.exit(1)`. => a real budget miss (assert exit 1) => autorun exits 1.

### PROBE 2 — win32 escape hatch (static read, node_modules/@lhci/cli/src/collect/node-runner.js)
- L109-117: run resolved as success ONLY when code===1 && win32 && isOutputLhrLike(stdout) && stderr has 'Generating results...' && stderr has 'Chrome could not be killed'. This is in the COLLECT child; it only decides whether to KEEP the fully-produced LHR. Scores live in the LHR regardless of pass/fail; assert reads them SEPARATELY afterward. Escape hatch cannot alter scores.

### PROBE 3 — chrome-launcher kill()/destroyTmp() (static read, lighthouse/node_modules/chrome-launcher/dist/chrome-launcher.js)
- L349 `this.destroyTmp()` is OUTSIDE kill()'s try/catch (L331-348) => destroyTmp rmSync EPERM escapes kill() uncaught (confirms shim premise). L371-372 export both default+named Launcher.

### PROBE 4 — FAILURE INJECTION: lhci assert vs REAL saved LHRs with tightened budget
Scratch config (a11y minScore 0.99 vs real 0.95-0.96): scratchpad/lighthouserc-TIGHT.json
Command: lhci assert --config=<scratch> --lhr=<repo>/.lighthouseci  (real audit output, Jul 14 23:12 run)
RESULT: 4 URLs each "categories.accessibility failure for minScore ... expected >=0.99 found 0.95/0.96",
        "Assertion failed. Exiting with status code 1." — EXIT STATUS = 1. GATE BITES ON A REAL BUDGET MISS.

### PROBE 5 — RETRY LOOP persistence (harness reproducing run-lighthouse.mjs L84-98)
fake lhci always exits 1 (deterministic persistent miss). Loop ran BOTH attempts, both exit 1.
Output: "HARNESS: total attempts=2, final status=1"; process exit=1. Retry cannot mask a persistent miss.

### PROBE 6 — shim wrapper behavior vs real chrome-launcher Launcher
mod.Launcher resolves (function); Launcher.prototype.kill is function. Thrown EPERM => rethrew?false,
return undefined (void, matches real), stderr emits "ChromeLauncher Chrome could not be killed (EPERM) ...".
ESCAPE-HATCH MATCH (substring 'Chrome could not be killed') = true. Shim swallows ONLY the teardown throw.

### PROBE 7 — missing-category fail-closed (static read, @lhci/utils/src/assertions.js)
L15 auditRan(undefined)=0; L88/L140-146 getStandardAssertionResults FAILS when any value undefined =>
a run missing a category assertion-audit fails closed in assert (not a silent pass).

### PROBE 8 — lhci bin resolution (harness reproducing resolveLhciBin)
Resolves node_modules/.bin/lhci.cmd (real). Bare-'lhci' fallback not exercised in gate. status ?? 1 and
initial let status=1 both bias to FAILURE, never silent success.

### HYGIENE
git status: only .chuck/session-state.md modified (pre-existing, not mine). lighthouserc.json diff vs HEAD = empty (untouched). Scratch config confined to scratchpad.

---

## Bobbi — owner-verifier code-review probes (cycle 1)

HEAD: 87e5c2820593cce7173bac99dd60fbf69d17f6d3 (verified via `git rev-parse HEAD`)
cwd for all: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web

### P1 — SEO/analytics unit tests (focus items 1,2,3,5) — PASS
cmd: npx vitest run tests/seo/sitemap.test.ts tests/seo/robots.test.ts tests/seo/metadata-uniqueness.test.ts tests/seo/layout-analytics.test.tsx --reporter=verbose
tail: 12 tests, 4 files, ALL PASS. Named tests incl:
  sitemap > enumerates exactly the 20 fixture painting pages, shaped /collection/painting/<slug>  PASS
  robots > disallows the trail status/check-in API routes  PASS
  robots > publishes the sitemap location  PASS
  metadata-uniqueness > no two public pages share a title / description  PASS
  layout analytics > renders the Vercel <Analytics /> component  PASS
  Test Files 4 passed (4) / Tests 12 passed (12)

### P2 — metadata-uniqueness NON-VACUITY (focus item 3) — PROVEN
Method: wrote UNTRACKED scratch test tests/seo/_scratch_nonvacuity.test.ts that imports the SAME
real page modules, resolves the SAME 39 pages, asserts pristine set clean, then injects one dup
title + one dup desc and asserts the identical dedup logic catches them. No tracked file modified.
cmd: npx vitest run tests/seo/_scratch_nonvacuity.test.ts --reporter=verbose
tail: 4 passed (4):
  resolves the full real page set (10 static + 9 cat + 20 painting = 39)  PASS
  the PRISTINE real set has NO duplicate titles or descriptions  PASS
  INJECTED duplicate title IS caught by the same dedup logic  PASS
  INJECTED duplicate description IS caught by the same dedup logic  PASS
Cleanup: rm tests/seo/_scratch_nonvacuity.test.ts ; `git status --short tests/seo/` => clean (no output).

### P3 — Iron rule 7: root manifest deps in lockfile (focus item 4) — CLEAN
Method: node lockcheck.mjs diffed packages[""] (root manifest mirror) between 41b710d and 87e5c28.
Output:
  ROOT dependencies    ADDED: @vercel/analytics@^2.0.1 ; REMOVED/CHANGED: none
  ROOT devDependencies ADDED: @lhci/cli@^0.15.1 ; REMOVED/CHANGED: none
  ROOT optional/peer   ADDED/REMOVED/CHANGED: none
  transitive: 279 new package nodes, 198 new top-level node_modules/* entries — ALL transitive of
  @lhci/cli (sentry, puppeteer, chrome-launcher, express, ...). Iron rule 7 governs direct deps;
  only the two sanctioned direct deps were added. package.json diff independently confirms same.

### P4 — full gate `npm run check` — PASS
cmd: npm run check   (lint + format:check + typecheck + test)
tail: eslint clean; prettier "All matched files use Prettier code style!"; tsc --noEmit clean;
  vitest: Test Files 26 passed (26) / Tests 198 passed (198).

### P5 — fixture slug shape/count (focus items 1,6) — CLEAN
cmd: node slugcheck.mjs
tail: total paintings: 20; slugs failing sitemap regex [a-z0-9._-]+: []; first sorted slug:
  a-colorful-crowd_product; matthews-turtle present: true. (getAllPaintingSlugs orders asc(slug),
  so sitemap's FIRST painting entry is a-colorful-crowd_product; test only .toContain-checks
  matthews-turtle presence, which holds.)

### P6 — item-3 (Wix redirects) code facts — CONFIRMED ABSENT (disposition = Binkley's)
grep redirects next.config.ts => none; next.config.ts has only images.remotePatterns + reactStrictMode.
grep -rln 'redirect|308' tests/e2e/ => no match. No redirects() and no redirect e2e test in this diff.

### P7 — Lighthouse config vs spec (coverage-first, NOT a focus item) — DIVERGENCE FOUND
Read lighthouserc.json: collect.settings.preset = "desktop".
BUILD-SPEC §10.2 line 337: "Perf >=85 MOBILE"; Architecture §11 line 254: "Performance >= 85 MOBILE".
grep confirmed both docs say mobile; config asserts against the desktop profile (materially laxer).
Finding F-BOBBI-M1-1 (important): the delivered Lighthouse budget does not gate the mobile
threshold the spec+architecture require. (M1's own DoD gate is `npm run check`+SEO tests; the
lighthouse gate is R5 go-live — but the artifact is wrong as landed.)

### P8 — @vercel/analytics/next real export (focus item 5) — CONFIRMED
cmd: node analytics-export.mjs (reads node_modules/@vercel/analytics/package.json exports)
tail: version 2.0.1; has ./next export: YES (import => ./dist/next/index.mjs). Layout imports
  `{ Analytics } from '@vercel/analytics/next'`. Real-package subpath exists; typecheck (P4) passes
  => the real import resolves, not merely the vitest mock.

## Binkley — ANOMALY RESOLVED: stale assertion-results.json; HEAD is clean

Binkley deleted .lighthouseci/ entirely and re-ran `bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run lighthouse"` on HEAD 87e5c28.
  re-run exit code: 0
  re-run log tail: "Checking assertions against 4 URL(s), 4 total run(s)" -> "All results processed!" -> "Done running autorun."
  FRESH .lighthouseci/assertion-results.json: []  (2 bytes — ZERO failed assertions)
  FRESH LHR category scores:
    /                                        perf=1     a11y=0.96  seo=1
    /collection                              perf=1     a11y=0.96  seo=1
    /collection/painting/matthews-turtle     perf=1     a11y=0.95  seo=1   <- a11y AT FLOOR (0.95==0.95)
    /murals/trail                            perf=0.99  a11y=0.95  seo=1   <- a11y AT FLOOR
  ALL 4 URLs meet the committed BUILD-SPEC budgets (perf>=0.85, a11y>=0.95, seo>=0.95).

VERDICT ON ANOMALY: the earlier expected>=0.99 FAILED entries were a STALE assertion-results.json
left from a prior (uncommitted 0.99-threshold) dev run. lhci autorun writes assertion-results.json
= [] when all assertions pass; the file's staleness misled a raw read. Ground truth on HEAD:
assertions PASS at the committed 0.95, gate exits 0 honestly, budgets genuinely met. The gate is
NOT de-gated. Source of truth = exit code + assertion-results on a CLEAN dir, not a persisted file.
Note residual: two pages sit EXACTLY at the a11y 0.95 floor (zero margin) — flagged NEEDS-SENIOR-REVIEW.

## Binkley — spot-check: sitemap 20-URL count is DB-derived, not hardcoded

cmd: node (probe) SELECT slug FROM paintings ORDER BY slug  against file:./ci.db (repo root)
  painting rows in ci.db: 20
  has matthews-turtle: true
  sample: a-colorful-crowd_product, a-pair-of-roseates, a-surprise-guest
Corroborates: build log "[+17 more paths]" + 3 shown = 20 SSG painting pages; e2e asserts exactly
20 /collection/painting/<slug> URLs. getAllPaintingSlugs() reads live DB (no hardcoded list).

## Binkley — spot-check: no lint/type suppressions snuck into M1 new files
no suppressions found in M1 source/tests (grep for eslint-disable/@ts-ignore/@ts-nocheck/.skip/.only/test.fixme/it.todo returned only benign process.exit(1) in run-lighthouse.mjs). check+coverage gates genuinely cover new code.


## Binkley — spot-check: Iron rule 7 — only sanctioned direct deps (lockfile root node)

cmd: node probe comparing package-lock.json packages[""] between 41b710d and 87e5c28
  dependencies: added=[@vercel/analytics]  removed=[]  versionChanged=[]
  devDependencies: added=[@lhci/cli]  removed=[]  versionChanged=[]
CONFIRMED: exactly the two sanctioned deps; no unsanctioned DIRECT dep in the lockfile root.
Manifest (package.json) matches: +@vercel/analytics ^2.0.1, +@lhci/cli ^0.15.1.

## Binkley — DoD gap finding F-BINK-M1-1: redirect map (item 3) NOT implemented (human-hands)

cmd: git show 87e5c28:next.config.ts | grep -nE "redirect|async redirects"  => (none)
cmd: grep -rlnE "308|redirect" tests/  => (no redirect/308 e2e test)
PROGRESS.md line 7: "M1 redirect map needs the operator's Wix URL list; rest of M1 unblocked."
BUILD-SPEC M1 item 3: next.config.ts redirects() + Playwright 308 assertions per mapped Wix URL.
BUILD-SPEC M1 DoD: requires "redirect map (operator-approved URLs, 308-tested)" among merged items.
BUILD-SPEC M1 escalation trigger: "Operator does not supply/approve the Wix URL list -> human-hands
  (the redirect map cannot be invented; Invariant 4)."
Rosebud Wix inventory exists (.chuck/reports/M1/rosebud-wix-inventory.md, ~95 URLs) but operator
has NOT approved the list; redirect map is a legitimately-parked human-hands item.

SEVERITY: IMPORTANT / DoD-INCOMPLETE (not a coded-gate failure). All 8 acceptance gates in
gates.json are code/CI gates and do NOT include the redirect map; the 7 deterministic gates PASS.
But the BUILD-SPEC M1 DoD is NOT fully met: item 3 is unimplemented pending operator Wix URLs.
This is Binkley's flag: the CODED milestone passes its gates; M1 is NOT DoD-complete until the
redirect map (operator-approved, 308-tested) lands. Correct disposition = human-hands escalation,
not an invented redirect list.

---

## Lola Granola - SEO/content owner-verifier probes (cycle 1)

HEAD: 87e5c2820593cce7173bac99dd60fbf69d17f6d3 | Base: 41b710d2c748471d832bba5a36e14c42c1b14518
cwd for all: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web

### L1 - sitemap/robots/metadata-uniqueness vitest suites - PASS
cmd: npx vitest run tests/seo/sitemap.test.ts tests/seo/robots.test.ts tests/seo/metadata-uniqueness.test.ts --reporter=verbose
output: 3 files, 11 tests, ALL PASS (sitemap: 5/5, robots: 3/3, metadata-uniqueness: 3/3).
Test Files 3 passed (3) / Tests 11 passed (11).

### L2 - layout-analytics test - PASS
cmd: npx vitest run tests/seo/layout-analytics.test.tsx --reporter=verbose
output: root layout analytics renders the Vercel Analytics component - PASS. 1 passed (1).

### L3 - real built sitemap.xml / robots.txt (from Binkley prior seeded build, .next/server/app) - QUOTED VERBATIM
Read .next/server/app/sitemap.xml.body and .next/server/app/robots.txt.body directly (built output, not source).
robots.txt.body:
  User-Agent: *
  Allow: /
  Disallow: /api/trail/status
  Disallow: /api/trail/checkin
  (blank line)
  Sitemap: https://byrachelpierce.com/sitemap.xml
sitemap.xml.body: well-formed urlset XML, 39 loc entries.
.meta files confirm HTTP 200, content-type application/xml (sitemap) / text/plain (robots).

### L4 - programmatic count of sitemap.xml.body (scratchpad/count-sitemap.mjs)
output:
  total locs: 39
  painting urls: 20
  category urls: 9
  static urls (incl homepage + /collection): 10
  trail api present: false
  duplicate check: no dupes
  base url check: all correct base

### L5 - fixture catalog cross-check (scratchpad/count-fixture.mjs)
output: fixture paintings count: 20; 20 slugs listed; set-equal to the 20 sitemap painting URLs (spot-checked matthews-turtle present in both).

### L6 - getAllPaintingSlugs is DB-driven, not hardcoded (src/lib/art-service.ts:192-198, read directly)
Confirms db.select({slug}).from(paintings).orderBy(asc(paintings.slug)) - no hardcoded list. Satisfies the M4 sitemap-vs-db gate design intent.

### L7 - real rendered painting-page HTML meta tags (scratchpad/extract-meta.mjs on .next/server/app/collection/painting/matthews-turtle.html)
output:
  TITLE: Matthew's Turtle | by Rachel Pierce
  CANONICAL LINK: NONE FOUND
  META og:image: https://byrachelpierce.com/art/web/matthews-turtle-7bb2b9a6.jpg
  META twitter:image: https://byrachelpierce.com/art/web/matthews-turtle-7bb2b9a6.jpg
  META twitter:card: summary_large_image
og:image/twitter:image are ABSOLUTE URLs (resolved via layout metadataBase), confirming the M1 BUILD-SPEC item-4 claim (painting pages have real OG images via webImagePath) with rendered evidence, not just source inspection.
FINDING: no link rel=canonical - see L8.

### L8 - canonical link tag site-wide sweep (scratchpad/check-canonical-all.mjs, all 30 prerendered .html files under .next/server/app)
output: html files found: 30 - every single one printed no-canonical. Zero canonical tags anywhere in the built output. No page in the diff or pre-existing tree sets metadata.alternates.canonical.

### L9 - structured data (JSON-LD/microdata) sweep
- grep -r application/ld+json|schema.org|JsonLd src/ - no files found (source-level).
- scratchpad/check-ldjson.mjs on matthews-turtle.html - has application/ld+json: false, has itemscope/itemtype (microdata): false.
- grep -i structured data|JSON-LD|schema.org|rich result docs/FINAL-BUILD-SPEC.md - no matches. Structured data is NOT promised anywhere in the Spec, so its absence is a gap against general SEO best practice, not a broken contract claim. Recorded as advisory finding, not a defect against this milestone's DoD.

### L10 - title/description length audit (scratchpad/title-lengths2.mjs) against the 10 static-page rendered titles/descriptions read directly from source
output (rendered title = base + " | by Rachel Pierce" template, per layout.tsx):
  AR: 47 chars title / 124 desc - ok/ok
  Collection: 29/155 - SHORT title/ok desc
  Story: 24/162 - SHORT title/LONG desc (truncation risk)
  Press: 24/125 - SHORT/ok
  Murals: 25/145 - SHORT/ok
  Visit: 33/162 - ok/LONG (truncation risk)
  Custom: 32/160 - ok/ok
  Contact: 26/148 - ok/ok
  Trail: 37/165 - ok/LONG (truncation risk)
  Home: 49/170 - ok/LONG (truncation risk)
4/10 descriptions exceed the conventional 160-char SERP-snippet truncation risk threshold (Story 162, Visit 162, Trail 165, Home 170). Titles all well under 60 chars (no truncation risk); several base titles are short (<30 rendered) - not a defect, just unused keyword real estate. Advisory, not a BUILD-SPEC violation (Spec doesn't mandate a length ceiling); flagged for content-voice/SEO judgment.

### L11 - Lighthouse SEO-category scores + Core Web Vitals, read from real LHR JSON (scratchpad/extract-lhr2.mjs on .lighthouseci/lhr-*.json, produced by Binkley's gate run on HEAD 87e5c28)
output:
  / : perf=1 a11y=0.96 seo=1 LCP=701ms CLS=0.0047 TBT=0ms
  /collection : perf=1 a11y=0.96 seo=1 LCP=592ms CLS=0 TBT=0ms
  /collection/painting/matthews-turtle : perf=1 a11y=0.95 seo=1 LCP=712ms CLS=0 TBT=0ms
  /murals/trail : perf=0.99 a11y=0.95 seo=1 LCP=762ms CLS=0.042 TBT=0ms
failing SEO audits: none, on all 4 URLs. SEO category = 1.0 (perfect) on every page.
CAVEATS (reconciling with Portnoy's lane per rule zero):
  - configSettings (Portnoy Probe 5): formFactor desktop, throttlingMethod simulate, cpuSlowdownMultiplier 1 - this is a DESKTOP lab run, not mobile. BUILD-SPEC section 10.2 and Architecture section 11 specify "Performance >= 85 MOBILE" (Portnoy finding F-BOBBI-M1-1 / Bobbi P7). I defer to Portnoy's performance-budget finding rather than re-litigating; flagging AGREEMENT here - my LCP/CLS numbers above are DESKTOP-preset lab numbers and must not be read as satisfying a mobile CWV claim.
  - INP: confirmed UNMEASURED. interaction-to-next-paint audit key does not exist in the LHR; interaction-to-next-paint-insight has score null, scoreDisplayMode notApplicable - Lighthouse navigation-mode (lab) runs cannot produce a real INP value (requires field/interaction data). NEEDS-SENIOR-REVIEW: INP is not measured by this harness at all, on any page.
  - numberOfRuns 1 in lighthouserc.json - single-run scores, not a median of N; noted as a measurement-stability caveat, not re-scored (Portnoy's lane).

### L12 - content-voice scope check for this diff
M1's src/ diff touches only: sitemap.ts (new), robots.ts (new), layout.tsx (+Analytics import/render only, no copy change), art-service.ts (+1 query fn, no copy). No new user-facing prose was authored in this milestone. Spot-checked existing (pre-M1) static-page copy against Architecture section 12.7 (sentence case, warm tourist-plain language, no fake urgency): titles/descriptions read via L10 comply (sentence case throughout, "on your wall" phrasing matches section 12.7's example verbatim, no exclamation points, no "limited time"/urgency language found). Not a M1-diff finding; recorded as inherited-compliant, not re-audited page-by-page (out of this milestone's change scope).

## Binkley — SPOT-CHECK CONFIRMS Portnoy Finding A (MAJOR): lighthouse audits DESKTOP, spec mandates MOBILE

Binkley independently verified Portnoy's mobile-vs-desktop finding against ALL primary sources:
  git show 87e5c28:lighthouserc.json | grep preset  =>  "preset": "desktop"
  DECISIONS D6: "asserting Performance >= 85 MOBILE / Accessibility >= 95 / SEO >= 95"
  Spec (docs/FINAL-BUILD-SPEC.md) §10 line 337: "Perf >=85 MOBILE, A11y >=95, SEO >=95"
  Architecture v1 §4 table line 49: "Lighthouse MOBILE ... Performance >= 85 ..."
  SITE-ARCHITECTURE-v2 §11 line 254: "Performance >= 85 MOBILE, Accessibility >= 95, SEO >= 95"
  SITE-ARCHITECTURE-v2 §2 line 22: "The audience is on a phone. Tourists on cellular ... primary users."
No DECISIONS entry sanctions a desktop substitution.

FINDING F-BINK-M1-2 (MAJOR): the lighthouse gate exits 0 but asserts against preset:"desktop"
(cpuSlowdownMultiplier:1, no network throttle — Portnoy confirmed via configSettings). The SPEC/
ARCH/D6 performance budget is >=85 MOBILE. Desktop perf 1.00/1.00/1.00/0.99 says NOTHING about the
mobile >=85 requirement. The gate is GREEN but VERIFIES THE WRONG FORM FACTOR — a degraded path
reporting success against the true contract. Mobile performance on HEAD = UNVERIFIED.
Note: a11y (0.95/0.96 floor) + seo (1.0) are form-factor-insensitive at the category level here, but
PERFORMANCE is exactly the metric mobile emulation changes most (CPU 4x + slow-4G throttle).
This is Binkley's load-bearing finding; it does NOT flip a deterministic gate red (the gate as
CONFIGURED exits 0), but it means the lighthouserc.json config does not implement the spec's budget.

### P9 — working-tree hygiene check — STRAY UNTRACKED FILE FOUND (not in M1 diff)
cmd: git status --short tests/ ; git ls-files --error-unmatch tests/seo/_probe_meta_coverage.test.ts ; git diff --name-only 41b710d..87e5c28 -- tests/seo/
tail: `tests/seo/_probe_meta_coverage.test.ts` is UNTRACKED (ls-files errors "did not match") and
  NOT in the M1 diff (diff lists only layout-analytics/metadata-uniqueness/robots/sitemap). Not a
  Bobbi artifact (Bobbi scratch _scratch_nonvacuity.test.ts confirmed deleted). Stray from a
  concurrent wave agent. Flagged F-BOBBI-M1-6 (hygiene, NEEDS-SENIOR-REVIEW); Bobbi did NOT delete
  it. May have been counted in P4's 198-test aggregate; does not change any per-item verdict.

## Binkley — delegate corroboration of F-BINK-M1-2 (desktop-vs-mobile) — THREE independent finds

- Portnoy Finding A (FAIL vs authored budget): lighthouserc preset:desktop; Spec §10.2 / Arch §11 /
  D6 all say ">=85 MOBILE". configSettings confirm cpuSlowdownMultiplier:1, mobile:false. Mobile perf UNVERIFIED.
- Bobbi F-BOBBI-M1-1 (IMPORTANT, high conf): same finding, grep-confirmed both docs; green attests DESKTOP not the spec MOBILE contract.
- Binkley independent primary-source read: D6 + Spec §10 L337 + Arch v1 §4 L49 + SITE-ARCH-v2 §11 L254 + §2 L22 ("audience is on a phone") — all mandate MOBILE. No DECISIONS entry sanctions desktop.
CONSENSUS: MAJOR/IMPORTANT. The lighthouse gate is green but audits the wrong form factor.

## Binkley — measuring the ACTUAL mobile perf to size the gap

NOTE: LHCI has NO "mobile" preset (valid presets: perf/experimental/desktop). Lighthouse DEFAULT
(omit preset) IS the mobile profile (Moto G4 emulation, 4x CPU, slow-4G). So preset:"desktop" is
an explicit opt-OUT of the spec's default mobile behavior. Binkley re-ran run-lighthouse.mjs with a
scratch config OMITTING preset (=mobile default), perf as WARN, port 3400, against the built app.
(First attempt used preset:"mobile" which LHCI rejected as invalid — corrected to omit preset.)
Result pending; folded in below when the run completes.

## Bobbi F-BOBBI-M1-2/3 (retry + numberOfRuns:1) vs Ronald-Ann verdict — reconciled

Ronald-Ann PROVED (PROBE 4/5) the shim+retry cannot mask a DETERMINISTIC/persistent budget miss.
Bobbi correctly notes the NEAR-THRESHOLD NOISY case differs: a perf score sitting exactly on 0.85
with numberOfRuns:1 is noisy, so a retry CAN flip a genuine near-boundary regression green. Both
true in their scopes. At HEAD the perf scores (desktop 1/1/1/0.99) are far from 0.85, so the noise
concern is LATENT not active on desktop; on mobile the margin may be thinner (see mobile run).

## Binkley — ACTUAL MOBILE Lighthouse scores (default profile, formFactor=mobile cpuMult=4)

Ran run-lighthouse.mjs with scratch config omitting preset (= mobile default). Real numbers:
  /                                       perf=0.92  a11y=0.96  seo=1.0   (OK >=0.85)
  /collection                             perf=null (transient 500 ERRORED_DOCUMENT_REQUEST on my
                                          single-run scratch server — NOT a HEAD defect; desktop gate
                                          loaded it fine at perf 1.0; re-measuring separately)
  /collection/painting/matthews-turtle    perf=0.90  a11y=0.95  seo=1.0   (OK)
  /murals/trail                           perf=0.89  a11y=0.95  seo=1.0   (OK, only 0.04 above floor)

SIZING F-BINK-M1-2: on MOBILE the budget (>=0.85) IS met for the 3 pages that scored, but margins
are FAR thinner than desktop (0.89-0.92 mobile vs 0.99-1.00 desktop). /murals/trail at 0.89 mobile
has only 0.04 margin — the desktop preset was hiding this. The FIX (drop preset:"desktop") is
low-risk (mobile currently passes) but the shipped gate does NOT enforce the spec's real MOBILE
contract, and combined with numberOfRuns:1 + retry, a mobile /murals/trail perf regression could
slip. Severity stays IMPORTANT/MAJOR: gate audits wrong form factor; spec contract UNVERIFIED-BY-GATE.

Cleaned: removed stray untracked tests/seo/_probe_meta_coverage.test.ts (delegate scratch artifact,
not in M1 diff) so it does not pollute the tree before ci-green. git status tests/ clean.

## Binkley — SPOT-CHECKS of delegate findings (re-executed independently)

1. SEO unit tests (Bobbi + Lola claim): npx vitest run sitemap+robots+metadata-uniqueness
   => Test Files 3 passed (3), Tests 11 passed (11). REPRODUCES.
2. Metadata non-vacuity (Bobbi P2 scratch-injection claim): Binkley scratch test resolved
   static=10 cats=9 paintings=20 total=39 pages; all 39 titles unique on real data; injected
   duplicate DETECTED by dedup (Set size < length). PASS — non-vacuity CONFIRMED. Scratch removed.
3. Portnoy Finding A / Bobbi F-BOBBI-M1-1 (desktop-vs-mobile): Binkley independently confirmed
   via primary sources (D6, Spec §10, Arch §4/§11/§2) + git show preset:"desktop" + measured real
   mobile scores (0.89-0.92). REPRODUCES + SIZED.
4. Ronald-Ann PROBE 4 (gate bites on real miss): to be spot-checked with a fresh LHR (below).
All delegate reports reviewed so far (Bobbi/Ronald-Ann/Portnoy/Lola) PASS spot-check — no report failed.

## Binkley — SPOT-CHECK of Ronald-Ann PROBE 4 (gate bites on real miss) — REPRODUCES

Produced fresh HEAD LHRs via committed gate: bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run lighthouse" => exit 0.
  Fresh committed-config assertion-results.json: []  (all 0.95 budgets met on HEAD)
Then ran lhci assert with a scratch tightened config (a11y minScore 0.99) against those real LHRs:
  categories.accessibility failure for minScore assertion
    expected: >=0.99   found: 0.96 (x2) / 0.95 (x2)
  "Assertion failed. Exiting with status code 1."
  ASSERT EXIT CODE = 1
CONFIRMED: the assert step — the exact codepath the lighthouse gate exit depends on — exits NON-ZERO
on a real budget miss. Ronald-Ann's claim reproduces on Binkley's own execution. This ALSO explains
the earlier 0.99 stale-artifact anomaly: it was precisely this kind of tightened-assert output left
in .lighthouseci from a prior dev experiment, not a de-gated gate.
Delegate reports Bobbi/Ronald-Ann/Portnoy/Lola all PASS spot-check — none re-dispatched.

---

## Snorklewacker — M1 refutation cycle 1 (adversarial, DIFFERENT-angle)

HEAD 87e5c28 | Base 41b710d | Diff hash 219dd9063802dffe82056fd48b69b71721c239c7
Rule zero: Unexecuted = hypothesis. Every entry below is EXECUTED with output, or labeled UNVERIFIED.

### SW-P1 — metadata-uniqueness coverage count (Claim 3). EXECUTED.
Instrumented clone of tests/seo/metadata-uniqueness.test.ts (scratchpad/_probe_meta_coverage) printed:
  PROBE_RESOLVED_COUNT=39  (10 static + 9 categories + 20 paintings)
  All 39 titles distinct; PROBE_DUP_TITLE_ACROSS_CATEGORIES=[]  (no dupes)
Coverage is real and non-vacuous — all 39 public pages resolved, none silently skipped.

### SW-P2 — metadata uniqueness MUTATION (Claim 3). EXECUTED.
Set src/app/press/page.tsx title 'Press' -> 'Story' (dup with /story). Ran tests/seo/metadata-uniqueness.test.ts:
  FAIL "no two public pages share a title": dupes=[["Story",["/press","/story"]]]
Reverted via `git checkout`. The uniqueness assertion BITES on a real collision. VERDICT: Claim 3 STANDS.

### SW-P3 — e2e sitemap regex attack (Claim 2). EXECUTED (scratchpad/probe-e2e-regex.mjs).
Synthetic sitemap.xml fed to the seo.spec.ts regex+Set:
  A_clean20=20 ; B_dup_masked=20 (21 emissions, 20 unique -> Set MASKS the duplicate)
  C_category_like=20 (bare /painting/ not matched — safe) ; D_nested=21 (/painting/p0/detail miscounted)
  E_19plus1dup=19 (a MISSING painting is NOT masked — good)
FINDING: the e2e test's Set collapses duplicate painting URLs (B) and miscounts nested paths (D).
It CANNOT detect a duplicate-emission bug. (Gap is covered by the UNIT sitemap.test.ts — see SW-P4.)

### SW-P4 — sitemap UNIT mutation: duplicate + drop (Claim 2). EXECUTED.
(a) Mutated src/app/sitemap.ts to emit paintingEntries TWICE. tests/seo/sitemap.test.ts:
    FAIL "produces no duplicate URLs" (39 vs 59) AND FAIL "enumerates exactly 20" (40 vs 20). Reverted.
(b) Mutated src/lib/art-service.ts getAllPaintingSlugs -> .slice(1) (drop one). sitemap.test.ts:
    FAIL "enumerates exactly the 20 fixture painting pages" (19 vs 20). Reverted.
The UNIT test catches BOTH the dup-emission (which e2e masks) and under-enumeration. 20 is DB-derived
(seeded from 20-painting fixture through getAllPaintingSlugs DB round-trip), asserted by fixture count.
VERDICT: Claim 2 (e2e proves exactly 20) — the e2e ALONE is weaker than claimed (Set masks dups), but
the milestone's sitemap correctness is fully gated by the UNIT test. Net: STANDS with e2e-scope caveat.

### SW-P5 — LHCI assertion-results.json vs exit-code decoupling (Claim 1 / anomaly). SOURCE-READ + EXECUTED.
Read @lhci source at HEAD's node_modules:
  - saved-reports.js L68-76 clearSavedReportsAndLHRs() unlinks ONLY lhr-*.json/html; NEVER assertion-results.json.
  - collect.js L246 calls it pre-collect; autorun.js L131-132 exits on collect failure BEFORE assert runs.
  - assert.js L62 getAllAssertionResults, L69/88-89 hasFailure, L112 saveAssertionResults(allResults),
    L114-116 exit 1 iff hasFailure. File + exit derive from the SAME computation within one invocation.
MECHANISM OF ANOMALY: a stale assertion-results.json (e.g. Ronald-Ann's 0.99 injection or a prior dev
config) survives the pre-collect clear; if a later run's collect FAILS, assert never runs and the stale
file persists — but then EXIT is non-zero too. Within one clean autorun, exit 0 REQUIRES assert to run
and overwrite the file to [] (includePassedAssertions unset). So NO path where file shows FAILURES and
exit is 0 inside one autorun. Binkley's fresh re-run ([], exit 0) is consistent. The disagreement Binkley
saw was CROSS-INVOCATION staleness (a sibling's 0.99 `lhci assert` writes to the same .lighthouseci/),
not a gate decouple. VERDICT on anomaly: benign stale-artifact; gate exit reflects assertions on a clean dir.

### SW-P6 — retry MASKS flaky-first/pass-second nondeterminism (Claim 1, MY ANGLE). EXECUTED.
Harness reproducing run-lighthouse.mjs L84-98 retry verbatim (scratchpad/harness-flaky-retry.mjs) with a
fake lhci that FAILS attempt 1 (a11y 0.94<0.95) and PASSES attempt 2 (a11y 0.95):
  FAKE-LHCI attempt1: ...accessibility failure expected>=0.95 found 0.94 / Assertion failed. Exit 1.
  HARNESS: retrying (attempt 2/2)
  FAKE-LHCI attempt2: All results processed!
  HARNESS: attemptsRun=2, FINAL_STATUS=0
  VERDICT: wrapper EXITED 0 despite attempt-1 assertion FAILURE => flaky-first/pass-second MASKED.
run-lighthouse.mjs L82-83 comment claims "Score failures are deterministic and would fail both attempts —
this does not mask a real budget miss." That claim holds ONLY if scores are perfectly deterministic.
With numberOfRuns:1 (lighthouserc.json L4) AND two pages sitting EXACTLY at the 0.95 a11y floor (Binkley
re-run: matthews-turtle & murals/trail a11y=0.95==floor), a single-sample borderline score CAN flip run
to run — the retry would then convert a first-run miss into a pass. This is a REAL de-gate vector for a
NONDETERMINISTIC borderline miss (distinct from Ronald-Ann's persistent-miss case, which stays failed).
Whether these specific scores actually flip across runs is UNVERIFIED (see below).

### SW-P7 — lighthouse-config-check.mjs blind spots (Claim 1). EXECUTED (scratchpad/config-check-clone.mjs).
Clone of the config-check pointed at a broken config (url:[], preset:desktop, numberOfRuns:1):
  categories:performance/accessibility/seo: error @ correct minScores
  URLs in broken config: [] | preset: desktop | numberOfRuns: 1
  LHCI CONFIG OK  <-- gate PASSES a config with ZERO urls, desktop preset, numberOfRuns:1 ; EXIT=0
The config-check gate enforces ONLY assertion level+minScore. It does NOT enforce: a non-empty URL list,
mobile preset (Spec/Arch/D6 require "mobile" — Portnoy's finding), or numberOfRuns>1. So neither the
mobile-vs-desktop deviation nor the single-run instability is caught by any M1 gate.

### SW-P8 — deps: only 2 sanctioned DIRECT (Claim 5). EXECUTED (scratchpad/dep-diff.mjs).
Diff of package-lock.json packages[""] base->HEAD:
  dependencies: added=["@vercel/analytics"] removed=[] versionChanged=[]
  devDependencies: added=["@lhci/cli"] removed=[] versionChanged=[]
package.json diff: +@vercel/analytics ^2.0.1, +@lhci/cli ^0.15.1, +2 npm scripts, nothing else.
VERDICT: Claim 5 STANDS — exactly 2 sanctioned direct deps.

### SW-P9 — full coverage + check + source-lint on HEAD (Claim 4). EXECUTED.
  npx vitest run --coverage: 26 files, 198 tests, ALL PASS, exit 0. Coverage 89.62% stmt / 84.39% branch.
  grep tests/ for .skip/.todo/.fixme/.only/xit/xdescribe: No matches found (zero quarantined tests).
  npm run check: FAILED — eslint --max-warnings 0 tripped on 3 UNTRACKED sibling scratch files under
    .chuck/probes/ (cutter-axe-scan-tmp.mjs, cutter-focus-contrast-tmp.mjs, cutter-keyboard-tmp.mjs).
    These are NOT in HEAD 87e5c28 (git cat-file -e -> NOT IN HEAD). eslint.config.mjs `ignores` omits
    .chuck/**, so any scratch .mjs there breaks `check`.
  npx eslint src tests scripts --max-warnings 0: exit 0 (HEAD's committed source is lint-clean).
VERDICT: Claim 4 STANDS for HEAD (198 pass, source lint-clean, no skips). The `check` failure is
working-tree contamination, NOT a HEAD defect — but the gate's sensitivity to unignored .chuck scratch
is a real hygiene fragility (NEEDS-SENIOR-REVIEW).

## Cutter John -- accessibility/UX owner-verifier probes (cycle 1)

HEAD: 87e5c2820593cce7173bac99dd60fbf69d17f6d3 | Base: 41b710d2c748471d832bba5a36e14c42c1b14518 | Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7
cwd for all: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
Full report: .chuck/reports/M1/cutter-cycle1.md

### C1 -- independent axe-core scan, 4 audited URLs -- FINDINGS (pre-existing, not M1-introduced)
cmd: node .chuck/probes/cutter-axe-scan-tmp.mjs (script since deleted from repo, archived at scratchpad/cutter-axe-scan.mjs), served on port 3300 (isolated from Binkley/Portnoy on 3200), axe-core 4.12.1 (already in node_modules via lhci-cli to lighthouse, no new dep installed)
output:
  home: 1 violation (color-contrast, serious, 46 nodes), 43 passes, 1 incomplete
  collection: 1 violation (color-contrast, serious, 40 nodes), 43 passes, 1 incomplete
  matthews-turtle: 2 violations (color-contrast serious 52 nodes; heading-order moderate 1 node), 45 passes, 1 incomplete
  murals-trail: 1 violation (heading-order moderate 1 node), 47 passes, 1 incomplete -- color-contrast clean here (0 violations, 1 incomplete on a Leaflet marker div)
Root cause verified: --color-teal #36b5cd (globals.css line 10) used as Header/Footer/hero background paired with white/light text, measured contrast ratios 1.49-3.01:1 against a 4.5:1 requirement. git log confirms Header.tsx/Footer.tsx not touched in 87e5c28's diff. Pre-existing sitewide defect, not introduced by M1.

### C2 -- which Lighthouse audits cost the 2 floor pages their score -- CROSS-CHECKED against Portnoy's real-LHR read
Read Portnoy's ledger entry (Probe 4, a11y-detail.mjs against real LHR JSON): matthews-turtle fails color-contrast(weight 7) plus heading-order(weight 3); murals-trail fails target-size(weight 7) plus heading-order(weight 3). This matches my independent axe scan exactly for color-contrast and heading-order. Independently verified target-size via direct measurement (cmd: node .chuck/probes/cutter-target-size-tmp.mjs, archived scratchpad/cutter-target-size.mjs): all anonymous-state interactive targets on murals-trail (mural markers 44x44px, zoom controls 44x44px, social links 330x28px) MEET the 24x24 WCAG 2.2 SC 2.5.8 minimum. The authenticated-state "I Visited" check-in button (MuralCheckInCard.tsx lines 140-141, minHeight 36px) was NOT reached (requires completing magic-link auth, out of scope per Iron Rule 4) -- flagged NEEDS-SENIOR-REVIEW as the plausible but unconfirmed target-size root cause.

### C3 -- scoring-fragility model, read from the ACTUAL bundled Lighthouse source (not assumed)
Read node_modules/lighthouse/core/config/default-config.js (color-contrast weight=7, heading-order weight=3, target-size weight=7, 73 total scored a11y audits summing to weight 404) and node_modules/lighthouse/core/scoring.js (arithmeticMean weighted average; lines 59-68 confirm NOT_APPLICABLE/INFORMATIVE/MANUAL audits get weight forced to 0 and are DROPPED from the denominator -- real per-page denominator is much smaller than 404). Modeled (scratchpad/cutter-weight-sum-v2.mjs) with a denominator sized to my own axe pass counts (43-47 per page) plus 2 failing audits (combined weight 10): reproduces scores in the 0.94-0.97 range, bracketing the real measured 0.95. CONCLUSION: the 0.95 floor is a genuine, deterministic arithmetic consequence of 2 real failing audits, not a rounding artifact or a fragile single-category fluke. Any additional weight-3-or-greater failing audit on either floor page drops it below 0.95.

### C4 -- keyboard traversal, painting-matthews-turtle (30 steps) and murals-trail (60 steps) -- NO TRAP, focus visible throughout
cmd: node .chuck/probes/cutter-keyboard-tmp.mjs (archived scratchpad/cutter-keyboard.mjs)
Full Tab-order transcripts recorded in the report. Every element on matthews-turtle showed outline solid 2px (sitewide focus-visible rule). Forward-plus-Shift+Tab-back boundary behavior re-verified as CORRECT (not a trap) after an initial false-alarm read of my own tab-count arithmetic -- retraction documented in the report (scratchpad/cutter-boundary-check.mjs).
NEEDS-SENIOR-REVIEW: no skip-to-main-content link located in the first 19-35 tab stops of either floor page (a full 18-link header plus 9-item dropdown must be tabbed through before page content on every page); axe's own bypass audit (WCAG 2.4.1, weight 7) reports 0 violations by a mechanism I did not independently locate -- flagging the discrepancy rather than asserting an unproven defect.

### C5 -- VERIFIED DEFECT: email sign-in input focus indicator, WCAG 2.2 SC 1.4.11 (2.11 to 1, below 3 to 1 minimum)
cmd chain: cutter-focus-check-tmp.mjs to cutter-focus-visible-check-tmp.mjs to cutter-focus-recheck-tmp.mjs to cutter-focus-contrast-tmp.mjs (archived scratchpad/cutter-focus-check.mjs etc)
Root cause: EmailSignInForm.tsx line 156 sets outline none inline on the trail-email input, which beats the cascade over the sitewide focus-visible rule (confirmed el.matches(focus-visible) is true, i.e. this IS a real keyboard focus event, but outline is suppressed). The compensating onFocus border-color handler (lines 160-165) DOES fire (computed border-top-color rgb(79,189,210) focused vs rgb(232,237,240) unfocused, confirmed with a settle delay after an initial transient-read false start) -- but that border-color's contrast against the input's own background computes to 2.11 to 1, below the WCAG 2.2 SC 1.4.11 3 to 1 minimum for non-text UI-state indicators. This is the ONLY email input on any of the 4 audited pages and the entry point to the entire Mural Trail feature. Not caught by axe (no focus-ring-contrast rule) or by Lighthouse's a11y category.

### C6 -- VERIFIED DEFECT (minor-moderate): Leaflet marker popup, no Escape-dismiss, close button Tab-unreachable
cmd chain: cutter-marker-keyboard-tmp.mjs to cutter-popup-dismiss-tmp.mjs to cutter-close-button-tmp.mjs to cutter-toggle-close-tmp.mjs (archived scratchpad, same base names)
Confirmed: Enter on a focused marker (role=button tabindex=0, Leaflet's own accessible-marker feature) opens its popup. Escape does NOT close it. Tab moves to the next marker without ever landing on the popup's own close-button anchor (role button, aria-label Close popup, href pointing at #close -- confirmed real, natively focusable, closes on mouse click) -- it is simply not in the Tab order reachable from the marker. Re-pressing Enter on the SAME still-focused marker DOES toggle the popup closed (verified keyboard-only recovery path exists -- not a full trap).

### C7 -- Dropdown menu (Collection nav) keyboard behavior -- CLEAN, no defect
cmd: part of cutter-trap-check-tmp.mjs. Enter opens (aria-expanded false to true), Escape closes (aria-expanded back to false, focus returns to trigger button). Correct implementation.

### C8 -- Analytics component regression check -- CLEAN, no defect
cmd: node .chuck/probes/cutter-analytics-check-tmp.mjs (archived scratchpad/cutter-analytics-check.mjs)
output: the Analytics component injects exactly 1 script tag pointing at /_vercel/insights/script.js, no DOM, no focusable element, no ARIA surface. Site-wide: 0 of 69 focusable elements lack an accessible name. No a11y regression from the M1-added Analytics import.

### HYGIENE
Probe scripts written to .chuck/probes/cutter-*-tmp.mjs (required for node_modules resolution of playwright-core/axe-core from inside the repo tree), executed, output captured, then archived to session scratchpad and DELETED from the repo. git status --porcelain confirmed clean of all my artifacts (only pre-existing .chuck bookkeeping files remain untracked, none mine). Server on port 3300 confirmed stopped via netstat (no LISTENING entry) before finishing. Never touched port 3200.

FLAG (Iron Rule 2): while grepping .env.local to confirm the CI db path (avoiding accidental prod access), a commented-out TURSO_AUTH_TOKEN value surfaced in my own tool output. Not used, not re-echoed, not reproduced in the report body beyond this flag. Operator should confirm rotation status per MEMORY.md precedent.

## Binkley — Cutter (a11y) DONE + spot-check context

Cutter axe-core scan (independent, port 3300, isolated) CONFIRMS the 0.95 a11y floor is genuine
arithmetic (modeled Lighthouse weighted scoring reproduces 0.95), NOT noise:
  - SERIOUS color-contrast sitewide: teal #36b5cd Header/Footer, white/light-teal text at 1.49-3.01:1
    vs 4.5:1 required (46-52 nodes/page). PRE-EXISTING (Header.tsx/Footer.tsx — NOT in M1 diff).
  - matthews-turtle: + page-local pill/label contrast (2.97-3.01:1) + heading-order h1->h3 skip.
  - murals-trail: target-size + heading-order.
  - NEW (beyond axe/LH): trail email input suppresses focus outline (WCAG 2.2 SC 1.4.11; border cue
    2.11:1 vs 3:1); Leaflet popup ignores Escape + close btn Tab-unreachable (recoverable, not a trap).
  - Keyboard: NO trap on either floor page (false alarm retracted).
  - <Analytics/>: ZERO a11y regression.
All defects trace to Header/Footer/EmailSignInForm/MuralMap — NONE touched by the M1 diff. M1 is the
milestone that made these latent defects GATE-VISIBLE (added the a11y assertion). Gate passes at
zero margin on pre-existing serious contrast failures => NEEDS-SENIOR-REVIEW (not an M1 regression).

## Binkley — Iron rule 2 note (Cutter incidental find): commented Turso token in .env.local

Cutter's .env.local read surfaced a commented-out TURSO_AUTH_TOKEN (not used/re-echoed). This is the
ALREADY-KNOWN, operator-WAIVED residual from M0 (ESCALATIONS E3 / DECISIONS D20 — token accepted
as-is, secret-sweep CLEAN across full public-repo history; exposure limited to local files + AI
conversation). NOT a new leak. Confirming against the settled record, not re-raising. Local .env.local
commented-secret hygiene is the deferred residual the operator already dispositioned.

## Binkley — SPOT-CHECK of Snorklewacker SW-P6 (retry masks flaky miss) — REPRODUCES + live-ness probe

Binkley re-ran the retry-loop harness (run-lighthouse.mjs L84-98 verbatim) with a fake lhci failing
attempt1 (a11y 0.94<0.95) then passing attempt2:
  FAKE attempt1: Assertion failed, exit 1 -> wrapper retries -> FAKE attempt2: exit 0
  WRAPPER FINAL STATUS = 0  => attempt-1 MISS MASKED
CONFIRMED: the retry converts a flaky first-run assertion failure into a gate PASS. SW-P6 reproduces.

The retry-mask is a REAL mechanism. Its LIVE-ness depends on whether the two floor pages
(matthews-turtle, murals/trail) actually vary below 0.95 run-to-run at numberOfRuns:1. Snorklewacker
left this UNVERIFIED (port contention). Binkley IS resolving it: running numberOfRuns:5 a11y audits on
both floor pages (DB env set, port 3405). Result folded in below.

## Snorklewacker other findings (folded)
- SW-P3: e2e sitemap uses Set(matchAll) -> masks a duplicate-emission bug (21->20) and miscounts a
  nested /collection/painting/p0/detail as a painting URL (21). e2e claim weaker than stated BUT the
  UNIT test (tests/seo/sitemap.test.ts) uses array length + explicit no-dupes and CATCHES both (SW-P4:
  dup-emit FAIL 59/39+40/20, drop FAIL 19/20). Milestone sitemap correctness fully gated by unit test.
  => minor NEEDS-SENIOR-REVIEW (harden e2e), NOT a de-gate.
- SW-P7: lighthouse-config-check.mjs passes a config with ZERO urls / desktop preset / numberOfRuns:1
  (LHCI CONFIG OK). It enforces ONLY assertion level+minScore — NOT url-nonemptiness, mobile preset,
  or run count. So NOTHING gates the desktop-vs-mobile deviation or run instability. => NEEDS-SENIOR-REVIEW.
- SW-P9 Attack C: `npm run check` FAILED in Snorklewacker's tree — but ONLY on untracked .chuck/probes/
  cutter-*-tmp.mjs scratch (NOT in HEAD; git cat-file -e confirms). HEAD source lint-clean (eslint src
  tests scripts exit 0); gate run recorded check rc=0. FRAGILITY: eslint ignores omit .chuck/**, and the
  gate writes probe scripts there — lint-dirty scratch there breaks check under --max-warnings 0. The
  recorded PASS depended on .chuck/probes being clean at gate time. => NEEDS-SENIOR-REVIEW (add .chuck/**
  to eslint ignores). NOTE: I have cleaned all delegate -tmp.mjs scratch (below) so the tip is clean.
- SW-P8: exactly @vercel/analytics + @lhci/cli (4th confirmation of Iron rule 7). STANDS.
- Claims 2/3/5 STAND; anomaly benign (matches Binkley resolution).

## Binkley — RESOLVES SW-P6 live-ness: a11y floor is DETERMINISTIC in-sample (retry-mask is LATENT)

Ran numberOfRuns:5 a11y audit on the two floor pages (DB env set, port 3405, via run-lighthouse.mjs):
  /collection/painting/matthews-turtle   runs(5): [0.95, 0.95, 0.95, 0.95, 0.95]  min=max=0.95
  /murals/trail                          runs(5): [0.95, 0.95, 0.95, 0.95, 0.95]  min=max=0.95
Both floor pages score a11y = 0.95 on EVERY one of 5 runs — ZERO variance.

RESOLUTION: Snorklewacker's SW-P6 retry-mask mechanism is REAL and reproduced (Binkley harness
confirmed retry exits 0 on flaky-first/pass-second), but its LIVE-ness at HEAD is NEGATIVE: the
specific floor-page a11y scores are DETERMINISTIC at 0.95 across 5 samples and do NOT flip below.
=> The retry-mask is a LATENT de-gate vector (real risk for a FUTURE borderline/noisy regression),
NOT a current live de-gate. It does NOT flip the M1 verdict to FAIL. It IS a NEEDS-SENIOR-REVIEW
item with a clear fix: set numberOfRuns>=3 and/or scope the retry to the chrome-launcher teardown
EPERM only (not any non-zero exit). Combined with the zero a11y margin (Cutter/Portnoy), this is the
milestone's highest-priority hardening item for a follow-up DECISIONS entry — but latent, not blocking.

## Binkley — VERDICT (deterministic gates + wave, HEAD 87e5c28, diff hash 219dd90)

PASS on all 7 deterministic gates. ci-green PENDING (branch tip unpushed — verify after push, Binkley last act).
All 6 delegates + Snorklewacker returned; every report SPOT-CHECKED, none failed (all reproduced on Binkley own execution).
THREE NEEDS-SENIOR-REVIEW flags: (1) lighthouse audits DESKTOP, spec mandates MOBILE [4 independent finds; real mobile 0.89-0.92 met but un-enforced]; (2) retry+numberOfRuns:1 at zero-margin a11y floor = LATENT de-gate [floor deterministic 0.95 x5 in-sample, not currently firing]; (3) redirect map (item 3) NOT built = DoD-incomplete, human-hands pending operator Wix URLs.
No HEAD defect flips a gate red. Consolidated report: .chuck/reports/M1/milestone-report.md.

---
## CYCLE 2 (re-gate) — HEAD ad97e84342331ac927246ae750339a80238bfac7 — Binkley

### PROBE C2-1: @lhci/utils median semantics (FLAG 2 point 2 — source, not commit message)
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
cmd: Read node_modules/@lhci/utils/src/assertions.js (getValueForAggregationMethod L56-68; getStandardAssertionResults L138-182; getAllAssertionResultsForUrl L411-448; getCategoryAssertionResults L258-279)
FINDING (CONFIRMED against source):
 - L139: `aggregationMethod = 'optimistic'` is the DEFAULT when unspecified.
 - categories:* are minScore (assertionType 'minScore', startsWith 'min').
 - L64-67: optimistic + min-type => useMin=false => Math.max(...values) (BEST run). This is the pre-fix hide-a-flaky-low-run behavior.
 - L57-61: aggregationMethod==='median' => true statistical median of sorted values.
 - L426: `options = {aggregationMethod, ...assertionOptions}` — per-assertion opts spread LAST => the config's "median" OVERRIDES base default.
 - L427: 'median-run' selects medianLhrs; 'median' does NOT (uses all lhrs) — config correctly uses "median" not "median-run".
 - L305->L275: getCategoryAssertionResults passes assertionOptions (with median) to getStandardAssertionResults.
CONCLUSION: The explicit aggregationMethod:"median" on each categories:* assertion genuinely applies the median-of-3 and overrides LHCI's optimistic(=max) default. Commit claim VERIFIED against @lhci/utils source.

### PROBE C2-2: teardown shim present at HEAD + retry-removal safety (FLAG 2 point 4)
cmd: git cat-file -e ad97e84:scripts/lighthouse-teardown-shim.mjs ; Read scripts/lighthouse-teardown-shim.mjs ; Read scripts/run-lighthouse.mjs
FINDING: shim tracked at HEAD (SHIM PRESENT AT HEAD). run-lighthouse.mjs L64-70 still wires shim via NODE_OPTIONS --import. Shim wraps Launcher.prototype.kill (L36) swallowing ONLY the teardown EPERM after audit completes. Retry loop removed (L77-92 single spawnSync). Teardown flake neutralized at source; retry removal loses no real transient. CONFIRMED at source level; runtime confirmation pending full lighthouse run (C2-5).

### PROBE C2-3: retry actually gone from run-lighthouse.mjs (FLAG 2 point 1)
cmd: git show ad97e84 -- scripts/run-lighthouse.mjs
FINDING: MAX_ATTEMPTS/for-loop deleted; single `spawnSync(lhciBin, args, ...)` then `process.exit(result.status ?? 1)`. No retry. CONFIRMED.

### PROBE C2-4: check gate (regression spot-check) — HEAD ad97e84
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
cmd: npm run check
OUTPUT: eslint . --max-warnings 0 clean; prettier All matched files use Prettier code style!; tsc --noEmit clean; vitest Test Files 26 passed (26) | Tests 198 passed (198). check_rc=0. NO REGRESSION.

### PROBE C2-5: lighthouse-config gate — HEAD ad97e84
cmd: node .chuck/probes/lighthouse-config-check.mjs
OUTPUT: categories:performance error @ minScore 0.85; accessibility error @ 0.95; seo error @ 0.95; LHCI CONFIG OK. rc=0.
NOTE: config-check validates level+minScore ONLY; does NOT gate form factor or aggregation method (SW-P7 cycle-1 stands). Form factor confirmed from produced LHRs (C2-7).

### PROBE C2-6: full lighthouse gate (mobile, 3 runs, median) — HEAD ad97e84
cmd: bash -c "export TURSO_DATABASE_URL=file:./ci.db && npm run db:seed-ci && rm -rf .lighthouseci && npm run lighthouse"
OUTPUT: Running Lighthouse 3 time(s) on each of 4 URLs; "Checking assertions against 4 URL(s), 12 total run(s)"; "All results processed!"; Uploading median LHR of each URL...success. Done running autorun. lighthouse_rc=0. GATE PASS on mobile.

### PROBE C2-7: formFactor + per-URL median-of-3 (independent) — HEAD ad97e84, 12 fresh LHRs
cmd: node scratch median-report.mjs over .lighthouseci/lhr-*.json
OUTPUT: Total LHRs 12 | non-mobile LHRs 0 (EVERY LHR formFactor=mobile, screenEmulation.mobile=true, w=412, dpr=1.75).
 / : perf [0.96,0.92,0.96]->0.96 | a11y [0.96x3]->0.96 | seo 1.00 | PASS
 /collection : perf [0.84,0.89,0.88]->0.88 | a11y [0.96x3]->0.96 | seo 1.00 | PASS  (0.84 flaky-low run ABSORBED by median — the exact flake class this fix handles; pre-fix optimistic default would have reported max=0.89)
 /collection/painting/matthews-turtle : perf [0.97x3]->0.97 | a11y [0.95x3]->0.95 FLOOR | seo 1.00 | PASS
 /murals/trail : perf [0.97,0.97,0.91]->0.97 | a11y [0.95x3]->0.95 FLOOR | seo 1.00 | PASS
ALL URLS MEET MOBILE MEDIAN BUDGET: true. FLAG 1 (mobile) genuinely fixed; two a11y floor pages remain zero-margin (pre-existing contrast, known residual).

### PROBE C2-8: gate STILL BITES on persistent miss (CLAIM D) — HEAD ad97e84, real LHRs
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
cmd: node node_modules/@lhci/cli/src/cli.js assert --config=<scratch: categories:accessibility error minScore 0.99 aggregationMethod median>
OUTPUT: "categories.accessibility failure for minScore assertion expected: >=0.99 found: 0.96 all values: 0.96,0.96,0.96" (/ ,/collection); "found: 0.95 all values: 0.95,0.95,0.95" (matthews-turtle, /murals/trail); "Assertion failed. Exiting with status code 1." tightened_assert_rc=1.
CONCLUSION: gate BITES; and LHCI prints the MEDIAN it asserts against (found:0.95 / all values 0.95,0.95,0.95) — runtime confirmation median is applied to categories:*.

### PROBE C2-9: median CHANGES gate outcome vs optimistic default (CLAIM B, runtime) — HEAD ad97e84
Same 12 real LHRs. /collection perf runs = [0.84, 0.89, 0.88] (median 0.88, max 0.89).
cmd A (median): node .../lhci/cli.js assert --config=<perf error minScore 0.89 aggregationMethod median>  => median_rc=1, "categories.performance failure for minScore assertion" on /collection.
cmd B (default optimistic): node .../lhci/cli.js assert --config=<perf error minScore 0.89>  => optimistic_rc=0, ZERO collection perf failures.
CONCLUSION: identical LHRs + threshold, OPPOSITE outcome by aggregation method. Proves (1) default IS optimistic/max (hides the 0.84 low run behind 0.89 max), (2) config's "median" genuinely applies and bites on true median. CLAIM B proven at RUNTIME, not just source (C2-1).

### PROBE C2-10: Flag 3 still correctly parked — HEAD ad97e84
cmd: git show ad97e84:next.config.ts | grep redirect ; git diff --stat 41b710d..ad97e84 | grep -i redirect
OUTPUT: NO redirects() at HEAD; NO redirect/next.config change in cumulative M1 diff. Known human-hands gap, NOT a new failure; no invented redirect list snuck in.

---
## CYCLE 2 (re-gate) — HEAD ad97e84 — Snorklewacker (adversarial, independent attack)

Rule zero: Unexecuted = hypothesis. Every entry EXECUTED with output, or labeled UNVERIFIED.
cwd for all: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web | HEAD: ad97e84

### SW2-P1 (CLAIM A) — formFactor of EVERY real HEAD LHR. EXECUTED.
cmd: node <scratch>/claimA-formfactor.mjs  (parses .lighthouseci/lhr-*.json produced by orchestrator run)
output: 12 LHR json files; 4 URLs x 3 runs. EVERY LHR:
  formFactor=mobile  se.mobile=true  412x823  dpr=1.75  cpu=4x  rtt=150
  SUMMARY: mobile=12 desktop=0 other/err=0 of 12
VERDICT: CLAIM A SURVIVES. No desktop LHR, no cross-run inconsistency; matches mobile emulation spec exactly.

### SW2-P2 (CLAIM B) — median vs optimistic distinguisher against REAL committed config. EXECUTED.
cmd: node <scratch>/claimB-exec.mjs  (feeds lighthouserc.json ci.assert into @lhci/utils getAllAssertionResults with synthetic a11y=[0.94,0.99,0.94])
output: {auditId:categories, prop:accessibility, name:minScore, expected:0.95, actual:0.94, values:[0.94,0.99,0.94], passed:false}
  actual used = 0.94 (MEDIAN) not 0.99 (optimistic/max). passed=false (gate BITES on median miss w/ a flaky high run present).
Source-verified independently: assertions.js L57-61 (median branch), L64-67 (optimistic=max default), L426 (options={aggregationMethod,...assertionOptions} => per-assertion median OVERRIDES base undefined default), L139 (default 'optimistic' only when undefined), L275/L305 (category path receives options w/ median).
VERDICT: CLAIM B SURVIVES. median genuinely reaches categories:* and overrides optimistic.

### SW2-P3 (CLAIM B/D) — REAL lhci assert binary vs 12 real HEAD LHRs. EXECUTED.
cmd: node_modules/.bin/lhci assert --config=<scratch>/lighthouserc-TIGHT.json  (a11y median>=0.99)
output: EXIT 1. "categories.accessibility failure for minScore expected>=0.99 found 0.95 all values: 0.95,0.95,0.95" (x2) / found 0.96 all values 0.96,0.96,0.96 (x2). "Assertion failed. Exiting with status code 1."
cmd: lhci assert --config=lighthouserc.json (COMMITTED) => EXIT 0, "Checking assertions against 4 URL(s), 12 total run(s)... All results processed!"
cmd: lhci assert --config=<scratch>/lighthouserc-PERF90.json (perf median>=0.90) => EXIT 1, "/collection performance found 0.88 all values: 0.84,0.89,0.88".
VERDICT: real binary reports the MEDIAN as "found" across all 3 real values and exits 1 on miss. CLAIM B+D confirmed on real data.

### SW2-P4 (CLAIM D) — median slip-through hunt. EXECUTED (partial artifact noted).
cmd: node <scratch>/claimD-slipthrough.mjs
finding: getAllAssertionResults FILTERS passed rows (assertions.js L479-480: return results.filter(r=>!r.passed) when includePassedAssertions falsy) — synthetic harness surfaces only FAILURES. On FAILURE cases: [0.94,0.94,0.99]->median 0.94 FAIL; [0.90,0.91,0.92]->0.91 FAIL. A persistent (>=2-of-3 below) miss is CAUGHT. A single 1-of-3 flake-low is tolerated BY DESIGN (median lands on 2nd-lowest) — that is correct median behavior, NOT a persistent miss slipping.
Real HEAD /collection perf runs [0.84,0.89,0.88]: the 0.84 run is BELOW the 0.85 budget; median 0.88 passes. This is the flaky-low tolerance median provides (and is STRICTER than the pre-fix optimistic default which tolerated 2-of-3 flakes).
VERDICT: CLAIM D SURVIVES — a genuine persistent sub-budget page (fails median) exits 1. No config found where a persistent median miss slips.
NOTE: earlier "median-run->undefined" reading (my claimB-negatives) is CONTAMINATED by the same pass-filtering; I DO NOT assert median-run is broken. That sub-claim = UNVERIFIED.

### SW2-P5 (CLAIM C) — shim scope: does it cover launch-phase transients? EXECUTED.
cmd: node <scratch>/claimC-shim-scope.mjs  (loads real shim, patches a fake Launcher, throws from kill() and launch())
output: shim-patched kill() with ETIMEDOUT: threw=false (shim swallows ANY throw from kill(), emits "ChromeLauncher Chrome could not be killed (ETIMEDOUT)"). shim-patched launch() with ECONNREFUSED: threw=TRUE (NOT caught).
FINDING: shim wraps ONLY Launcher.prototype.kill (teardown phase). launch()-time / server-connect transients escape it.

### SW2-P6 (CLAIM C) — what the removed retry covered vs LHCI's OWN retries. SOURCE-READ (EXECUTED greps).
- chrome-launcher.js L88-89: connectionPollInterval=500ms, maxConnectionRetries=50 => ~25s Chrome-connect tolerance (launch timeout already handled internally).
- @lhci/cli node-runner.js L134-147 runUntilSuccess: while(attempts<3){try return run()...} => LHCI retries EACH per-URL run 3x on ANY error/exit (launch, connect, transient). collect.js L133 calls it per run.
- collect.js L155-169/L251: startServerAndDetermineUrls (server start via runCommandAndWaitForPattern, startServerReadyTimeout) is called ONCE, OUTSIDE the URL loop, NOT retried. autorun.js L133-134: collect child not retried at autorun level.
RESIDUAL: the ONLY transient class the removed whole-autorun retry covered that neither the shim NOR runUntilSuccess covers = a SERVER-START failure (port-3200 EADDRINUSE / ready-pattern timeout at collect.js L163). Per-URL Chrome-launch/connect transients ARE covered (50x poll + 3x runUntilSuccess).
Empirical: cycle-1 gate run (M1.log L246-259) and cycle-2 run (12 LHRs, M1-results.json lighthouse pass=true rc=0) BOTH completed clean with NO teardown EPERM and NO retry needed. The EPERM flake did not fire in either captured real run.
VERDICT: CLAIM C SURVIVES AS WRITTEN. The commit claims only the teardown-EPERM flake is neutralized + retry masked sub-budget misses; it does NOT claim to preserve server-start-race coverage. The one lost class (server-start race) is an environment condition, not a product transient, and a persistent collision fails both attempts anyway. Flag: NEEDS-SENIOR-REVIEW that server-start races are now un-retried (narrow, was never a claimed guarantee).

### SW2-P7 — HYGIENE. EXECUTED.
cmd: git status --short (tracked only) => " M .chuck/session-state.md" (pre-existing, not mine).
git rev-parse HEAD => ad97e84342331ac927246ae750339a80238bfac7 (unchanged).
git diff --stat HEAD -- lighthouserc.json scripts/run-lighthouse.mjs scripts/lighthouse-teardown-shim.mjs => empty (untouched). All scratch confined to session scratchpad.

### PROBE C2-11: Binkley SPOT-CHECK of Snorklewacker SW2-P5/SW2-P6 (CLAIM C, load-bearing) — HEAD ad97e84
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
cmd A: node scratch shim-scope-check.mjs => shim reassigns Launcher.prototype: ['kill','kill']; guards on: ['kill']; touches launch()? false. CONFIRMS shim wraps ONLY kill()/teardown; launch-phase escapes.
cmd B: grep runUntilSuccess node_modules/@lhci/cli/src/collect/*.js => collect.js:133 calls runner.runUntilSuccess(url,...); node-runner.js:134 async runUntilSuccess; L138 `while (attempts.length < 3)` retry loop. CONFIRMS LHCI retries EACH per-URL run 3x on any error — covers launch/connect transients; removed whole-autorun retry was redundant for those. Server-start race is the one un-retried residual (narrow, env condition).
RESULT: Snorklewacker SW2-P5/P6 REPRODUCED on Binkley execution. Spot-check PASS. CLAIM C SURVIVES with the server-start NEEDS-SENIOR-REVIEW flag.

## CYCLE 2 SPOT-CHECK SUMMARY (Binkley)
- CLAIM A (formFactor mobile): Binkley C2-7 (12/12 mobile) == Snork SW2-P1 (12/12 mobile). REPRODUCED.
- CLAIM B (median applies+overrides): Binkley C2-9 (median FAIL @0.89 vs optimistic PASS @0.89 on same LHRs) + source C2-1 == Snork SW2-P2/P3. REPRODUCED at runtime.
- CLAIM D (gate bites): Binkley C2-8 (a11y 0.99 median -> exit1) == Snork SW2-P3. REPRODUCED.
- CLAIM C (retry-removal safe): Binkley C2-11 (shim=kill-only, LHCI runUntilSuccess 3x) == Snork SW2-P5/P6. REPRODUCED.
All 4 claims SURVIVED refutation AND Binkley independent reproduction. No delegate report failed spot-check; none re-dispatched.

## CYCLE 3 (M1 completion gate — redirect map) — Binkley independent probes
HEAD: 4f9717984e49a6d50cb26133e981be6249fdb3da  cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web

### PROBE C3-1: redirect map shape (scratchpad/redirect-check.mjs) — independent parse of next.config.ts redirectRules
TOTAL RULES: 38 | ALL permanent:true? true | INTERNAL: 34 EXTERNAL(SHOP_URL): 4
EXTERNAL sources: /shop, /online-store, /items, /jewelry
IDENTITY-SHADOW (must be empty): []  | SELF-LOOP: []  | CHAIN dests-also-sources: []
WILDCARDS: /blog/:path* -> /press | /post/:slug* -> /press | over-match on served routes: []
DUPLICATE sources: []
RESULT: shape claims REPRODUCED (38/34+4/all-permanent/no-shadow/no-loop/no-chain/no-overmatch/no-dup).

### PROBE C3-2: E6 pair-by-pair match (scratchpad/e6-match.mjs) — config vs operator-approved E6 answer transcribed as data
E6 entries: 38 | config rules: 38 | MISMATCHES: 0 MISSING: 0 EXTRA: 0 => E6-MATCH: EXACT
identity /murals /contact /press /collection has rule? false (all four) — correctly no rule.
Includes E6 corrections verified: /copy-of-2019-6 (Landscapes) -> /collection (NOT beach-coastal); /social-media -> /; policy pages -> /; /jewelry+store -> SHOP_URL; /bio -> /story direct.
RESULT: "matches E6 exactly" REPRODUCED.

### PROBE C3-3: e2e gate ran the redirect spec (from run-gates.sh M1.log, gate 4/8 e2e, rc=0 pass=1)
54 tests total; tests\e2e\redirects.spec.ts: 39 redirect tests ALL "ok" — 31 internal 1:1 (incl /copy-of-2019-6 -> /collection), 4 external -> Lightspeed store, 4 wildcard samples (/post/some-post, /blog/categories/in-the-news, /post/deeply/nested/slug, /blog/2019/some-old-post) -> /press. NOT skipped, NOT zero-tested. This is the deterministic 308 proof.

### PROBE C3-4: Binkley INDEPENDENT RUNTIME 308 probe (spot-check of Snorklewacker claims 1/3/5)
cwd: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web  HEAD: 4f97179  server: next start (built from ci.db-seeded HEAD tree)
FIRST ATTEMPT (port 3223) — CONTAMINATED: /custom-orders -> loc=/WRONG-SNORK ; /shop -> HTTP 307. 
  ROOT CAUSE: probe ran while Snorklewacker's cycle-3 MUTATION TEST had /WRONG-SNORK + permanent:false live in next.config.ts and baked into .next. Confirmed contamination, NOT a code defect:
  git diff HEAD -- next.config.ts => EMPTY; git hash-object next.config.ts == git rev-parse HEAD:next.config.ts == 9e0237e996dc31e1b8a60db1798c86c675716203; grep WRONG-SNORK|permanent: false => none in working tree.
RE-RUN on VERIFIED-CLEAN tree (rm -rf .next; npm run build BUILD_RC=0; next start port 3223):
  /custom-orders    -> 308 Permanent Redirect  loc=/custom                                 OK
  /copy-of-2019-6   -> 308 Permanent Redirect  loc=/collection   (E6 Landscapes correction) OK
  /social-media     -> 308 Permanent Redirect  loc=/                                        OK
  /blog             -> 308 Permanent Redirect  loc=/press                                   OK
  /shop             -> 308 Permanent Redirect  loc=https://store33134078.company.site/      OK
  /jewelry          -> 308 Permanent Redirect  loc=https://store33134078.company.site/      OK
  /post/some-slug   -> 308 Permanent Redirect  loc=/press        (wildcard)                  OK
  /blog/categories/x-> 308 Permanent Redirect  loc=/press        (wildcard nested)           OK
  /murals /press /collection -> 200 OK (served identity, NOT redirected)                     OK
  /posts /blogs     -> 404 Not Found (sibling prefixes, wildcard does NOT over-match)        OK
RESULT: on committed HEAD 4f97179 every sampled redirect is a correct 308 with correct Location; no 307/301/200; no shadow; no wildcard over-match. Snorklewacker claims 1/3/5 REPRODUCED independently. First-attempt anomalies were mutation contamination, now cleared.

### PROBE C3-5: deterministic gate suite (run-gates.sh M1 on 4f97179) — 7/8 local gates GREEN
check PASS(rc0) | coverage PASS(rc0) | build-seeded PASS(rc0) | e2e PASS(rc0, 54 tests incl 39 redirect) | lighthouse-config PASS | lighthouse PASS(rc0, mobile median-of-3) | dep-audit PASS(rc0)
ci-green FAIL(pass=0) — EXPECTED/DEFERRED: origin chuck/M1 still at 41b710d (tip 4f97179 not pushed); gh run list --branch chuck/M1 returns non-success. NOT a verdict failure this pass; verified as LAST ACT post-push. run-gates overall exit=1 solely due to deferred ci-green.

### PROBE C3-6: Binkley spot-check — Bobbi F-BOBBI-M1-C3-1 (missing DECISIONS entry) + Ronald-Ann e2e non-vacuity
grep -niE 'redirect|37 vs 38|38 rule|arithmetic|D24' DECISIONS.md => no entry for the 37-vs-38 arithmetic; last id is D23 (no D24). CONFIRMS Bobbi finding: test comment (redirects.test.ts L66-72) commits to flagging the discrepancy for DECISIONS, but no DECISIONS entry exists. Code count (34 internal) is CORRECT per E6; this is a paper-trail debt only.
npx playwright test tests/e2e/redirects.spec.ts --list => "Total: 40 tests in 1 file". CONFIRMS Ronald-Ann: spec genuinely generates 40 tests (not zero/skipped). Reproduced.

### PROBE C3-7: Binkley spot-check — trailing-slash 2-hop chain (Lola L1 / Snork claim-3), curl -L num_redirects
/blog/  (trailing) => 2 redirects, final 200 at /press   (/blog/ ->[308] /blog ->[308] /press ; Next trailingSlash normalization)
/post/x/(trailing) => 2 redirects, final 200 at /press
/blog   (no slash)  => 1 redirect,  final 200 at /press
RESULT: benign 2-hop 308->308 chain on TRAILING-SLASH variants only; both hops permanent, finite, correct terminus, no equity loss. NEEDS-SENIOR-REVIEW follow-up, NOT gate-blocking. Reproduced.

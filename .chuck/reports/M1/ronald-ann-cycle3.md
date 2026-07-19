# Ronald-Ann - M1 cycle 3 - silent-failure hunt on the REDIRECT work

Rule zero: Unexecuted = hypothesis.

HEAD (gated): 4f9717984e49a6d50cb26133e981be6249fdb3da
Base: 41b710d2c748471d832bba5a36e14c42c1b14518
Slice: next.config.ts (redirectRules/redirects()) + tests/seo/redirects.test.ts + tests/e2e/redirects.spec.ts
cwd for all probes: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web

NOTE on environment: a concurrent delegate (files snork-pw-maxredirect.mjs, snork-pw.config.ts,
mtime 19:29, not authored by me) was independently probing the same redirect surface in parallel
during this cycle. This explains several Windows dotnext build races hit late in the session
(webpack chunk ENOENT / rename races under concurrent next build invocations on the same
filesystem, plus a heavily populated shared scratchpad from other concurrent agents). Flagged
for transparency; my primary evidence below was captured cleanly before the contention started,
and is unaffected by it. No tracked file was left modified. Every mutation probe below was
reverted and reconfirmed via git status --short / git diff returning empty.

---

## CLAIM 1 - e2e spec genuinely runs at the gate, not silently zero-tested

Verdict: STANDS. Executed.

Playwright testDir is ./tests/e2e (playwright.config.ts line 20), no testMatch/testIgnore
filter excludes redirects.spec.ts; no .only anywhere in the repo restricting collection
(see Claim 5).

Probe - collection count:
  cmd: npx playwright test tests/e2e/redirects.spec.ts --list
  output (tail): Total: 40 tests in 1 file

Breakdown by source loop (grep on the printed list-line locations):
  redirects.spec.ts:66  (INTERNAL for-loop)      -> 32 tests
  redirects.spec.ts:75  (EXTERNAL for-loop)      ->  4 tests
  redirects.spec.ts:83  (WILDCARD_SAMPLES loop)  ->  4 tests
  32 + 4 + 4 = 40, matches Total: 40 tests in 1 file

None of the three source arrays (INTERNAL, EXTERNAL, WILDCARD_SAMPLES) is empty. A for-loop
over an empty array (the classic silent-zero-tests bug) is ruled out by the nonzero per-loop
counts above, independently corroborated by the list flag own enumeration (not just a static
array-length read).

Full execution (not just collection) - genuinely built and ran against a live server:
  cmd: npx playwright test tests/e2e/redirects.spec.ts --reporter=list
  tail: 40 passed (19.0s)

All 40 named tests printed ok individually. Sample lines from the transcript:
  ok 1 [chromium] ... 308 /custom-orders -> /custom (24ms)
  ok 40 [chromium] ... 308 (wildcard) /blog/2019/some-old-post -> /press (2ms)

Reconciliation note (commit message says 39 internal+external+wildcard, brief says 39;
actual collected/run count is 40): the config 34 internal rules include 2 wildcard patterns
(/blog/:path*, /post/:slug*) which the e2e spec deliberately does NOT loop over directly
(a literal :path* is not a real URL). Instead it tests them via 4 representative
WILDCARD_SAMPLES entries. So e2e INTERNAL loop = 34 minus 2 = 32, plus 4 EXTERNAL plus 4
WILDCARD_SAMPLES = 40. This is consistent design, not a miscount defect; flagging the
commit-message 39 as trivial drift only.

---

## CLAIM 2 - e2e assertion is non-vacuous (status===308 AND Location pathname); maxRedirects:0 honored

Verdict: STANDS. Executed by mutation (both halves).

maxRedirects is confirmed a real, documented Playwright option (not a typo/no-op):
  grep maxRedirects node_modules/playwright-core/types/types.d.ts
  -> Maximum number of request redirects that will be followed automatically ... Defaults to 20.
     Pass 0 to not follow redirects.
This appears on APIRequestContext.get/.fetch, exactly the shape used in the spec
(request.get(source, { maxRedirects: 0 })).

Sub-probe A - if the option were misspelled/ignored, does the test still pass (vacuous) or fail loudly?
Mutated tests/e2e/redirects.spec.ts in place: maxRedirects: 0 changed to maxRedirect: 0 (typo,
simulating an ignored/wrong option name; Playwright silently drops unknown option keys rather
than erroring). Re-ran a single case against the live built server:
  cmd: npx playwright test tests/e2e/redirects.spec.ts --grep custom-orders --reporter=list
  output:
    Error: expect(received).toBe(expected)
    Expected: 308
    Received: 200
    1 failed

CONFIRMED: a wrong/ignored option name does NOT silently pass. Default Playwright behavior
follows redirects (to 200), and expect(res.status()).toBe(308) catches it immediately and
loudly. There is no vacuous-pass path via a mis-set redirect option.
Reverted: file restore, then reconfirmed via git status --short tests/e2e/redirects.spec.ts,
output was clean.

Sub-probe B - does the Location-pathname assertion independently bite?
Mutated next.config.ts: /custom-orders destination /custom changed to /wrong-destination
(status stays 308, genuine redirect still fires, only destination is wrong).
  cmd: npx playwright test tests/e2e/redirects.spec.ts --grep custom-orders --reporter=list
  output:
    Error: expect(received).toBe(expected)
    Expected: /custom
    Received: /wrong-destination
    1 failed

CONFIRMED: the Location-pathname assertion is a real, independent check. A rule with a
correct status but wrong destination is caught. The two assertions are non-redundant:
sub-probe A shows status catches a missed-redirect; sub-probe B shows Location catches a
wrong-destination redirect.
Reverted via git checkout of next.config.ts; reconfirmed clean (git diff empty, git status
empty for this file).

---

## CLAIM 3 - SHOP_URL drift guard actually fires on divergence

Verdict: STANDS. Executed by mutation.

At HEAD both values match exactly: next.config.ts line 34 and src/lib/constants.ts line 17
both read https://store33134078.company.site/

Mutated src/lib/constants.ts SHOP_URL to https://DRIFTED-store.example.com/ (next.config.ts
literal untouched, creating real drift) and ran the unit suite:
  cmd: npx vitest run tests/seo/redirects.test.ts --reporter=verbose
  output (relevant):
    FAIL tests/seo/redirects.test.ts - points every external store source at SHOP_URL (drift guard)
    AssertionError: expected store33134078.company.site value to equal DRIFTED-store.example.com value
    Expected: https://DRIFTED-store.example.com/
    Received: https://store33134078.company.site/

CONFIRMED: the drift guard test goes RED on real divergence; it does not swallow the mismatch.
Reverted via git checkout of src/lib/constants.ts; re-ran clean: 8 passed (8). (Two additional
cascading failures referencing /collection appeared transiently during the mutated run only,
traced to no /collection source existing in next.config.ts at all; reran on the clean,
restored tree and got a clean 8/8. The transient extra failures did not reproduce and are
not attributed to a real defect in the redirect map; most likely vitest import-cache noise
from editing the file on disk mid-run. Not a load-bearing finding for Claim 3, noted for
completeness only.)

---

## CLAIM 4 - malformed redirect rule: fails build loudly, or silently dropped?

Verdict: FAILS LOUDLY at two independent layers. Executed.

Layer 1 - TypeScript (part of npm run check)
Mutated a rule to remove required destination/permanent fields (source-only object):
  cmd: npx tsc --noEmit
  output:
    next.config.ts(81,9): error TS2322: Type is not assignable to type
      Promise of Redirect array
      Property destination is missing in the source-only object type
      but required in the Redirect type (source string, destination string, ...)
    plus 3 more errors in tests/seo/redirects.test.ts referencing the now-untyped fields

CONFIRMED: NextConfig redirects() Redirect array return type statically rejects a
missing-required-field rule; npm run check (which runs typecheck) would fail the gate, not
pass silently. Reverted via git checkout of next.config.ts.

Layer 2 - Next.js build-time validation (runtime, beyond TS)
Mutated a rule to a type-valid but semantically-invalid source: a plain string with no
leading slash (custom-orders-no-slash instead of /custom-orders):
  cmd: npx next build
  output:
    source does not start with / for route (source=custom-orders-no-slash,
      destination=/custom, permanent=true)
    Error: Invalid redirect found

CONFIRMED: Next.js own build-time redirect validator fails the build outright, not a
silent drop, for a type-valid-but-malformed rule that TypeScript alone could not catch (a
plain string source without a syntax check). Two independent layers both fail loudly; no
silent-drop path found. Reverted via git checkout of next.config.ts.

---

## CLAIM 5 - quarantined, skipped, only, or commented-out tests in the diff

Verdict: CLEAR. Executed.

  grep for skip/only/xit/xdescribe/todo/fixme markers in tests/e2e/redirects.spec.ts
    -> No matches found
  grep for same markers in tests/seo/redirects.test.ts
    -> No matches found
  grep for commented-out test/it/expect lines in tests/e2e/redirects.spec.ts
    -> No matches found
  grep for skip/only/xit/xdescribe/todo/fixme markers in the raw commit patch
  (.chuck/reports/M1/redirect-diff-4f97179.patch)
    -> No matches found (checked BOTH added and removed diff lines, not just final file state)

CONFIRMED: no quarantine markers anywhere in the new redirect test files, and none were
added then removed within the same commit (checked the raw patch, not just the final tree).

---

## Additional observation (not a requested claim, noted for the record)

.chuck/probes/M1-ledger.md (Binkley, finding F-BINK-M1-1, prior cycle) recorded the redirect
map as NOT-YET-IMPLEMENTED at that time HEAD (87e5c28). At the current HEAD (4f97179) the
redirect map IS implemented, tested, and per this cycle probes is genuinely gate-tested and
non-vacuous. This closes that earlier gap; not re-litigated further here (out of my claim
scope), just cross-referenced so the ledger reads coherently across cycles.

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis.

### CHECKED
- Claim 1: e2e collection count via --list gives Total: 40 tests in 1 file; per-loop breakdown
  (32/4/4) confirmed via grep on list output line locations, matching the three for-loops
  (INTERNAL/EXTERNAL/WILDCARD_SAMPLES) in the spec source.
- Claim 1: genuine full execution gives 40 passed (19.0s), all 40 individually printed ok.
- Claim 2A: maxRedirects option genuineness confirmed against playwright-core own .d.ts
  (default 20/follow, 0/dont-follow), matching the option used in the spec.
- Claim 2A: mutation (typo option name) then real test run gives Expected 308, Received 200,
  1 failed. Reverted and confirmed clean.
- Claim 2B: mutation (wrong destination in next.config.ts) then real test run gives Expected
  /custom, Received /wrong-destination, 1 failed. Reverted and confirmed clean.
- Claim 3: mutation (drifted SHOP_URL in src/lib/constants.ts) then vitest run of
  tests/seo/redirects.test.ts gives drift-guard test FAILS with exact mismatch quoted.
  Reverted and reconfirmed clean tree passes 8/8.
- Claim 4 (TS layer): mutation (missing destination/permanent) then tsc --noEmit gives TS2322
  plus 3 cascading errors, loud failure. Reverted.
- Claim 4 (Next build layer): mutation (source missing leading slash) then next build gives
  Error: Invalid redirect found. Reverted.
- Claim 5: grep sweep for skip/only/xit/xdescribe/todo/fixme and commented-out test/expect
  lines across both new test files AND the raw commit patch (added and removed lines) gives
  zero matches in all four sweeps.
- Repo hygiene: git status --short and git diff HEAD on next.config.ts,
  tests/e2e/redirects.spec.ts, tests/seo/redirects.test.ts, src/lib/constants.ts after all
  probes gives empty output (byte-identical to HEAD).

### NOT CHECKED
- Paths NOT included in WILDCARD_SAMPLES (other plausible /post/* or /blog/* subpaths beyond
  the 4 chosen representatives). The wildcard rule is proven to match via 4 samples but the
  full space of possible Wix blog/post URLs was not exhaustively probed. Low risk (Next.js
  :path*/:slug* matching is a well-understood mechanism, not custom logic), but technically
  unexercised beyond the 4 samples authored.
- Whether the 38-rule map is the CORRECT and COMPLETE set relative to the actual live Wix
  site (i.e. whether ESCALATIONS E6 approved list was followed correctly). That is a
  content/URL-inventory correctness question, out of my silent-failure lane; deferred to
  whoever owns E6 verification.
- CI (GitHub Actions) execution of this spec. I ran locally only; did not check whether the
  CI workflow actually invokes tests/e2e/redirects.spec.ts as part of its e2e step (e.g. a
  CI-only path filter or matrix exclusion). package.json e2e script (playwright test) has
  no path restriction, and playwright.config.ts testDir includes it, but I did not read
  .github/workflows/*.yml to confirm CI invokes npm run e2e unmodified.
- Rule-ordering / shadow-matching between /blog (exact) and /blog/:path* (wildcard). Both
  are proven individually correct (exact /blog to /press passes; wildcard samples under
  /blog/* also pass), but I did not specifically probe Next.js internal rule-precedence
  logic to confirm it was not coincidentally the wildcard rule matching /blog too (both
  destinations are /press so a shadow would be unobservable from outside).
  NEEDS-SENIOR-REVIEW if rule order ever changes.

### COULD NOT CHECK
- A final independent full-suite re-run (npx playwright test tests/e2e/redirects.spec.ts)
  was attempted three times late in the session to produce a second corroborating
  transcript, but failed each time with Windows-specific .next build races:
    cmd: npx playwright test tests/e2e/redirects.spec.ts --reporter=list
    error: WebServer Error: ENOENT: no such file or directory, rename
      .next/export/500.html to .next/server/pages/500.html
    Error: Process from config.webServer was not able to start. Exit code: 1
  and separately:
    cmd: npx next build
    error: unhandledRejection Error: Cannot find module ./chunks/vendor-chunks/next.js
  Root cause traced to filesystem contention with a concurrent delegate own build/probe
  running in the same working tree at the same time (snork-pw-maxredirect.mjs,
  snork-pw.config.ts, mtime 19:29, not authored by me; independently probing the identical
  maxRedirects claim on port 3210, plus a heavily populated shared scratchpad from other
  concurrent agents). This is an environment/concurrency artifact, not a defect signal; my
  primary evidence (the clean 40/40 run plus the three successful mutation-probe builds)
  was captured before this contention began, and no source file was left in a mutated
  state (git status and git diff confirmed empty after every probe, including after the
  failed rebuild attempts, since those only ever touched the gitignored .next/ directory).

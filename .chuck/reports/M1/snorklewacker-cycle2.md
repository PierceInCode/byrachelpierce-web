# Snorklewacker M1 SCOPED RE-GATE (cycle 2) adversarial refutation

- Project root: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
- HEAD (gated): ad97e84342331ac927246ae750339a80238bfac7
- Base: 41b710d
- Remediation diff scope (verified untouched by me vs HEAD): lighthouserc.json + scripts/run-lighthouse.mjs (plus scripts/lighthouse-teardown-shim.mjs, pre-existing, untouched this diff)
- Charge: REFUTE the four claims. Every refutation carries an EXECUTED probe (command + output) or is labeled UNVERIFIED.

Rule zero: Unexecuted = hypothesis. Anything assertable by running a command was run (output quoted) or labeled UNVERIFIED.

I independently re-attacked each claim rather than confirming the cycle-2 source reads. The orchestrator full lhci autorun completed during my run (12 LHRs in .lighthouseci/, assertion-results.json empty, M1-results.json lighthouse gate pass=true rc=0); I parsed those real LHRs and ran the REAL lhci assert binary against them.

---

## 1. CLAIM A formFactor=mobile on EVERY produced LHR

Claim (commit ad97e84): removing preset:desktop makes LHCI audit its default MOBILE form factor on every produced LHR.

Attack SW2-P1: parsed configSettings.formFactor + screenEmulation from every .lighthouseci/lhr-*.json produced by the orchestrator HEAD run.
```
node scratch/claimA-formfactor.mjs
total LHR json files: 12
URL http://localhost:3200/                                    (3 runs)  formFactor=mobile se.mobile=true 412x823 dpr=1.75 cpu=4x rtt=150  (x3)
URL http://localhost:3200/collection                          (3 runs)  formFactor=mobile se.mobile=true 412x823 dpr=1.75 cpu=4x rtt=150  (x3)
URL http://localhost:3200/collection/painting/matthews-turtle (3 runs)  formFactor=mobile se.mobile=true 412x823 dpr=1.75 cpu=4x rtt=150  (x3)
URL http://localhost:3200/murals/trail                        (3 runs)  formFactor=mobile se.mobile=true 412x823 dpr=1.75 cpu=4x rtt=150  (x3)
=== SUMMARY: mobile=12 desktop=0 other/err=0 of 12 ===
```
Every one of 12 LHRs (4 URLs x 3 runs): formFactor=mobile, screenEmulation.mobile=true, 412x823, DPR 1.75, 4x CPU, rtt 150 the exact mobile-emulation fingerprint the claim asserts. Zero desktop. Zero cross-run inconsistency.

VERDICT: STANDS (SURVIVED). Best attack (hunt for any desktop or inconsistent LHR) found none.

---

## 2. CLAIM B the median genuinely gates categories:*

Claim: LHCI default aggregation for categories:* is optimistic (=max, hides a flaky low run); explicit aggregationMethod:median is required and overrides it; median-run would NOT work, only median.

Attack 1 independent source trace (node_modules/@lhci/utils/src/assertions.js), read myself:
- L56-68 getValueForAggregationMethod: median => true statistical median; else optimistic+min-type => max (hide-low default).
- L138-139 getStandardAssertionResults: aggregationMethod defaults to optimistic ONLY when the field is undefined.
- L361 resolveAssertionOptionsAndLhrs: base aggregationMethod is undefined (config sets it per-assertion).
- L426 options = spread of {aggregationMethod} then assertionOptions LAST => options.aggregationMethod === median WINS over the undefined base.
- L427 median-run ? medianLhrs : lhrs => median uses ALL lhrs.
- L304-305 to L275: categories+auditProperty path passes options (with median) into getCategoryAssertionResults to getStandardAssertionResults.

Attack 2 empirical distinguisher on the REAL committed config (SW2-P2): fed lighthouserc.json ci.assert into the actual getAllAssertionResults with a11y=[0.94,0.99,0.94] (median 0.94, max 0.99). optimistic would give 0.99/pass; median gives 0.94/fail.
```
node scratch/claimB-exec.mjs
{auditId:categories, prop:accessibility, name:minScore, expected:0.95, actual:0.94, values:[0.94,0.99,0.94], passed:false, level:error}
accessibility actual used = 0.94 (MEDIAN) not 0.99 (max). passed = false (gate BITES with a flaky high run present).
```
Attack 3 REAL lhci binary found-value on real LHRs (SW2-P3): tightened assert printed found: 0.95 all values 0.95,0.95,0.95 and found: 0.96 all values 0.96,0.96,0.96 the binary reports the median across all 3 real runs.

VERDICT: STANDS (SURVIVED). median demonstrably reaches categories:* and overrides the optimistic default, by source AND executed distinguisher on real + synthetic data. The median-run-does-not-work sub-claim I could not cleanly settle (see manifest, UNVERIFIED) non-load-bearing, since the config uses median, which is proven.

---

## 3. CLAIM C removing the whole-autorun retry loses NO real transient coverage

Claim: the win32 chrome-launcher EPERM teardown flake is neutralized at source by lighthouse-teardown-shim.mjs (NODE_OPTIONS --import), so the retry only masked real sub-budget misses.

Attack 1 shim scope (SW2-P5): loaded the real shim, patched a fake Launcher, threw a non-EPERM error from kill() and a connect error from launch().
```
node scratch/claimC-shim-scope.mjs
ChromeLauncher Chrome could not be killed (ETIMEDOUT) spawn ETIMEDOUT during launch
shim-patched kill() with ETIMEDOUT: threw=false     <- shim swallows ANY throw from kill(), not just EPERM
shim-patched launch() with ECONNREFUSED: threw=true <- launch()-phase transients ESCAPE the shim
```
The shim wraps ONLY Launcher.prototype.kill (teardown). A launch/connect-phase transient is NOT caught by it.

Attack 2 what the removed retry covered vs LHCI OWN retries (SW2-P6, greps + source):
- chrome-launcher.js L88-89: connectionPollInterval=500, maxConnectionRetries=50 => ~25s Chrome-connect tolerance (launch-timeout handled internally).
- @lhci/cli node-runner.js L134-147 runUntilSuccess: while attempts < 3, try return this.run(url) => LHCI retries EACH per-URL run 3x on ANY error/exit. collect.js L133 calls it per run.
- collect.js L155-169 and L251: startServerAndDetermineUrls (server start via runCommandAndWaitForPattern, gated by startServerReadyTimeout) is called ONCE, OUTSIDE the URL loop, NOT retried. autorun.js L133-134: collect child not retried at autorun level.

Per-URL Chrome-launch/connect transients are ALREADY covered by chrome-launcher 50x poll + LHCI 3x runUntilSuccess the removed whole-autorun retry added nothing for those. The ONE class the removed retry uniquely covered (neither shim nor runUntilSuccess covers) is a server-start failure (port-3200 EADDRINUSE / ready-pattern timeout at collect.js L163).

Empirical corroboration: cycle-1 gate run (M1.log L246-259) and cycle-2 run (12 LHRs; M1-results.json lighthouse pass=true rc=0) BOTH completed clean no teardown EPERM, no retry needed. The EPERM flake did not fire in either captured real run.

VERDICT: STANDS (SURVIVED) with scoped caveat. The refutation found a real residual (server-start races now un-retried), but this does NOT break the claim as written: the commit claims only the teardown-EPERM flake is neutralized and that the retry masked real sub-budget misses it never claimed to preserve server-start-race coverage. A server-start port collision is an environment condition (a persistent collision fails both attempts anyway). NEEDS-SENIOR-REVIEW: the narrow server-start-race class lost its only retry layer acceptable, but silently covered before.

---

## 4. CLAIM D the gate STILL BITES on a real persistent budget miss

Claim: with numberOfRuns=3 + median, a genuine sub-budget page must still exit 1.

Attack 1 REAL lhci assert, tightened, vs real HEAD LHRs (SW2-P3):
```
node_modules/.bin/lhci assert --config=scratch/lighthouserc-TIGHT.json   (a11y median >= 0.99)
TIGHT-ASSERT-EXIT:1
  x categories.accessibility failure for minScore  expected >= 0.99  found 0.95  all values 0.95, 0.95, 0.95   (matthews-turtle, murals/trail)
  x ...                                             found 0.96  all values 0.96, 0.96, 0.96                    (/, /collection)
Assertion failed. Exiting with status code 1.

node_modules/.bin/lhci assert --config=lighthouserc.json   (COMMITTED)
COMMITTED-ASSERT-EXIT:0   ->  Checking assertions against 4 URL(s), 12 total run(s) ... All results processed!

node_modules/.bin/lhci assert --config=scratch/lighthouserc-PERF90.json   (perf median >= 0.90)
PERF90-ASSERT-EXIT:1
  x /collection categories.performance failure  expected >= 0.9  found 0.88  all values 0.84, 0.89, 0.88
```
A real median miss (a11y and perf) exits 1. Committed budgets pass (exit 0), consistent with assertion-results.json empty.

Attack 2 slip-through hunt (SW2-P4): tried to construct a persistent miss that median lets slip. Cannot: median gates the middle value, so any page failing 2-or-more of 3 runs fails the median ([0.94,0.94,0.99] to 0.94 FAIL; [0.90,0.91,0.92] to 0.91 FAIL). median tolerates only a SINGLE flaky low run out of 3 correct intended behavior, and STRICTER than the pre-fix optimistic default (which took the max, tolerating up to 2 flaky low runs).

Live thin-margin evidence: real HEAD /collection mobile perf runs = [0.84, 0.89, 0.88] the 0.84 run is BELOW the 0.85 budget; median 0.88 passes. Exactly the flaky-low tolerance median provides; the mobile perf margin is genuinely thin (~0.03 at the median), which is why median-of-3 (not numberOfRuns:1) matters here.

VERDICT: STANDS (SURVIVED). A genuinely persistent sub-budget page exits 1 on both a11y and perf, proven with the real binary against real LHRs. No config found where a persistent median miss is silently swallowed.

---

## Flags (each backed by proof, not self-report)

- NEEDS-SENIOR-REVIEW (CLAIM C residual): server-start races (port-3200 EADDRINUSE / ready-pattern timeout, collect.js L163) are now un-retried. Not a product transient; not a claimed guarantee; but silently covered before the retry removal. Low risk (did not fire in either captured run).
- NEEDS-SENIOR-REVIEW (carried from cycle 1, still true): /collection mobile perf median margin ~0.03 (one real run 0.84 below the 0.85 budget; median 0.88 saves it). matthews-turtle and murals/trail a11y sit exactly at the 0.95 floor. Median-of-3 makes these honest but margins are thin a small mobile regression will legitimately go red.

No claim survives only on redundancy or self-report; each verdict is backed by an executed probe with quoted output.

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

### CHECKED (executed command + settling output)
- CLAIM A formFactor/screenEmulation of all 12 real HEAD LHRs (SW2-P1): all mobile, 412x823, dpr 1.75, cpu 4x, rtt 150. STANDS.
- CLAIM B median overrides optimistic for categories:* source trace (assertions.js L56-68/139/361/426-427/275/305) + empirical distinguisher on real committed config a11y=[0.94,0.99,0.94] to actual 0.94/false (SW2-P2) + real lhci found=median (SW2-P3). STANDS.
- CLAIM C shim wraps only kill()/teardown; launch-phase escapes (SW2-P5); LHCI runUntilSuccess 3x + chrome-launcher 50x poll already cover launch transients; server-start is the one un-retried residual (SW2-P6). STANDS as written + NEEDS-SENIOR-REVIEW.
- CLAIM D real lhci assert exits 1 on tightened a11y median (0.99) and perf median (0.90); committed config exits 0; no persistent-miss slip constructible (SW2-P3, SW2-P4). STANDS.
- HYGIENE no tracked files changed by me; HEAD=ad97e84; lighthouserc.json, run-lighthouse.mjs, shim untouched vs HEAD (SW2-P7).

### NOT CHECKED (in scope, not attacked debt, not clearance)
- Orchestrator autorun end-to-end exit code: inferred from M1-results.json (lighthouse pass=true rc=0) + assertion-results.json empty + 12 complete LHRs, NOT re-run by me (would collide with the just-finished run on port 3200; completed artifacts are ground truth).
- upload / temporary-public-storage step: out of the four claims scope; not attacked.
- SEO/analytics/sitemap unit-test + dep-set claims (cycle-1 STANDS): out of this scoped re-gate; not re-attacked.

### COULD NOT CHECK (attempted, exact command failed or artifact reproduce the gap)
- median-run semantics for categories:* (CLAIM B sub-claim median-run would NOT work). Synthetic probes (claimB-symmetry.mjs, claimB-negatives.mjs) returned median-run to 0 rows / undefined, BUT that is an ARTIFACT of getAllAssertionResults pass-filtering (assertions.js L479-480 filters out passed results when includePassedAssertions is falsy) combined with empty-audits synthetic LHRs cannot distinguish median-run-passed-and-filtered from median-run-produced-no-result. Status: UNVERIFIED I do NOT assert median-run is broken.
  Command to settle it: lhci assert with a config setting median-run + includePassedAssertions:true against real on-disk LHRs, comparing reported found-value to the median-run selection. Not run: real LHRs were the committed set; re-collecting risked port 3200; sub-claim is not load-bearing (config uses median, already proven).

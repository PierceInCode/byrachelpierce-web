# Milestone report -- M1 SCOPED RE-GATE (cycle 2) -- byrachelpierce-web

Binkley Anxiety-Closet SCOPED re-gate of the M1 remediation. Fresh context, no stake in passing. This is NOT a second full review: it verifies the two cycle-1 GATE-QUALITY findings are genuinely fixed on ad97e84, reviews the remediation diff only, and runs ONE adversarial refutation pass. Rule zero governs: unexecuted = hypothesis.

- HEAD gated: ad97e84342331ac927246ae750339a80238bfac7
- Base (merge-base with integration): 41b710d2c748471d832bba5a36e14c42c1b14518
- Remediation diff hash (git show ad97e84): 10494053133c0197dc98202949b2f74e84aa3e8c
- Cumulative M1 diff hash (41b710d..ad97e84): b7329271a52e75dcd488042a284b71104fae5224
- Remediation touches ONLY: lighthouserc.json (13 lines) + scripts/run-lighthouse.mjs (36 lines). Confirmed via git show --stat; no surface outside the finding set, so the SCOPED wave is correct, NOT escalated to a full re-wave.
- Probe ledger: .chuck/probes/M1-ledger.md (cycle-2 section: PROBE C2-1..C2-11 + Snorklewacker SW2-P1..P7). Refutation report: .chuck/reports/M1/snorklewacker-cycle2.md.

## VERDICT: PASS -- FLAG 1 and FLAG 2 genuinely remediated on ad97e84. No regression. Refutation survived on all four claims.

This re-gate renders PASS on whether the two cycle-1 GATE-QUALITY defects are genuinely fixed. It does NOT close M1: the redirect map (Flag 3) remains a pending human-hands item (operator-approved Wix URLs) that needs a final delta re-gate + push + CI-green before write-gate.sh is invoked. NO gate artifact written this pass; NO merge.

## In plain language

The two problems the last gate flagged are now genuinely fixed. (1) The speed/accessibility/SEO budget now measures the MOBILE version of each page (it was measuring desktop before) -- every one of the 12 measurements I ran came back mobile, and all four pages pass on mobile. This brings the config into line with decision D6, so no waiver is needed. (2) The gate now runs each page 3 times and takes the middle score (median), and a risky retry-the-whole-thing-once-on-failure shortcut was removed -- that shortcut could have quietly turned a real failure into a pass. I proved the median genuinely changes the outcome (a page that scores 0.84/0.89/0.88 is now judged on 0.88, not the best 0.89) and that the gate still fails hard on a real budget miss. The redirect list (item 3) still needs your approved URLs and is correctly left undone.

## The two findings -- verified genuinely FIXED

### FLAG 1 (F-BINK-M1-2 / Portnoy A / Bobbi F-BOBBI-M1-1) -- MOBILE form factor: FIXED

Cycle-1 defect: lighthouserc.json carried settings.preset=desktop, so the green Lighthouse gate attested the DESKTOP profile where Spec 10, Architecture 4/11, DECISIONS D6, and the phone-audience premise mandate Performance>=85 MOBILE. No DECISIONS waiver sanctioned the substitution.

Fix on ad97e84: settings.preset=desktop REMOVED (git show ad97e84 -- lighthouserc.json). LHCI default form factor is mobile.

VERIFIED (PROBE C2-6, C2-7 -- my own full run + LHR parse; corroborated by Snorklewacker SW2-P1):

- Full gate run on HEAD: seed ci.db then npm run lighthouse (clean .lighthouseci) -> lighthouse_rc=0, 'Checking assertions against 4 URL(s), 12 total run(s)', 'All results processed!'.
- Every one of 12 produced LHRs (4 URLs x 3 runs): formFactor=mobile, screenEmulation.mobile=true, width=412, dpr=1.75. non-mobile count = 0.
- Per-URL median-of-3 on mobile, all meet committed budgets (perf>=0.85, a11y>=0.95, seo>=0.95):
  - /                                    perf [0.96,0.92,0.96]->0.96 | a11y 0.96 | seo 1.00 | PASS
  - /collection                          perf [0.84,0.89,0.88]->0.88 | a11y 0.96 | seo 1.00 | PASS
  - /collection/painting/matthews-turtle perf [0.97,0.97,0.97]->0.97 | a11y 0.95 (floor) | seo 1.00 | PASS
  - /murals/trail                        perf [0.97,0.97,0.91]->0.97 | a11y 0.95 (floor) | seo 1.00 | PASS
- The fix brings config INTO COMPLIANCE with D6 (mobile), so the divergence is GONE, not merely waived. No DECISIONS waiver needed. CONFIRMED.
- Note: lighthouse-config-check.mjs gates level+minScore only, NOT form factor (SW-P7 cycle-1 stands as a known probe limitation) -- form factor is proven from produced LHRs, not the config-check gate.

### FLAG 2 (SW-P6 latent de-gate + zero a11y margin) -- FIXED (both sub-parts)

Cycle-1 defect (a): run-lighthouse.mjs retried the whole autorun once on any non-zero exit with numberOfRuns=1 -- proven able to convert a flaky-first/pass-second assertion miss into a PASS. (b) two pages sit at the a11y 0.95 floor with zero margin.

Fix on ad97e84: numberOfRuns 1->3; EXPLICIT aggregationMethod=median on each categories:* assertion; the whole-autorun retry REMOVED from run-lighthouse.mjs (single spawnSync propagating the real exit code).

VERIFIED ADVERSARIALLY (four independent probes, each reproduced by me):

1. Retry actually GONE (PROBE C2-3): git show ad97e84 -- scripts/run-lighthouse.mjs -- MAX_ATTEMPTS/for-loop deleted; body is a single spawnSync(lhciBin, args, ...) then process.exit(result.status ?? 1). No retry. CONFIRMED.

2. Median genuinely applied to categories:* -- CONFIRMED AGAINST @lhci/utils SOURCE, not the commit message (PROBE C2-1): node_modules/@lhci/utils/src/assertions.js -- L139 default aggregationMethod=optimistic (only when undefined); L64-67 optimistic + min-type (minScore) => Math.max (BEST run, hides a flaky low run); L57-61 median => true statistical median; L426 options={aggregationMethod, ...assertionOptions} (per-assertion opts spread LAST => config median OVERRIDES base default); L427 median-run selects medianLhrs but median uses all lhrs (config correctly uses median NOT median-run); L305->L275 category path receives the median option. AND CONFIRMED AT RUNTIME (PROBE C2-9): the same 12 real LHRs asserted at perf minScore 0.89 give OPPOSITE outcomes -- median => exit 1 (/collection median 0.88 < 0.89), default optimistic => exit 0 (max 0.89 >= 0.89). Same LHRs, same threshold, opposite gate outcome by aggregation method: proves the default IS optimistic/max and the config median genuinely applies and bites.

3. Gate STILL BITES on a persistent miss (PROBE C2-8): lhci assert vs the real HEAD LHRs at a11y minScore 0.99 (aggregationMethod median) => 'categories.accessibility failure ... found: 0.95 all values: 0.95,0.95,0.95 ... Assertion failed. Exiting with status code 1.' rc=1. The binary reports the MEDIAN as the asserted value (found=0.95 across all-values 0.95,0.95,0.95) -- runtime proof median is applied. Committed config exits 0 (assertion-results empty).

4. Retry removal does NOT reintroduce a real teardown flake (PROBE C2-2, C2-11): scripts/lighthouse-teardown-shim.mjs is tracked at HEAD (git cat-file -e) and still wired via NODE_OPTIONS --import in run-lighthouse.mjs L64-70. It wraps Launcher.prototype.kill (kill-only, confirmed: shim reassigns only kill, touches launch=false), swallowing the transient win32 EPERM AFTER the audit completes. The EPERM flake did not fire in either the cycle-1 or cycle-2 captured full runs. So removing the retry loses no real teardown transient. CONFIRMED.

Residual (a11y zero margin): matthews-turtle and /murals/trail still sit at exactly a11y 0.95 (pre-existing WCAG contrast in Header/Footer, NOT M1-introduced, untouched by this diff). Median-of-3 now makes these honest (no retry can mask a dip), but the margin is thin -- carried forward as a known residual, NOT a defect of this remediation. NEEDS-SENIOR-REVIEW (carried from cycle 1).

## Adversarial refutation (Snorklewacker cycle 2, effort max) -- ALL FOUR CLAIMS SURVIVED

Dispatched to REFUTE (not confirm): formFactor=mobile holds every run; median actually gates; removing the retry loses no real transient; the gate still bites. Its best attacks failed to break any claim. Findings SPOT-CHECKED by Binkley (see below); all reproduced.

- CLAIM A (mobile) SURVIVED: 12/12 LHRs mobile (SW2-P1). Matches Binkley C2-7.
- CLAIM B (median gates categories) SURVIVED: source trace + synthetic distinguisher (a11y [0.94,0.99,0.94] -> actual 0.94 median, passed=false) + real binary found=median (SW2-P2/P3). Matches Binkley C2-1/C2-9.
- CLAIM C (retry removal safe) SURVIVED with scoped caveat: shim wraps kill() only; launch/connect transients ARE covered by LHCI runUntilSuccess (3x/URL, node-runner.js L138) + chrome-launcher 50x poll; only residual is a server-start race (port collision / ready-pattern timeout, un-retried) -- an environment condition the commit never claimed to preserve. NEEDS-SENIOR-REVIEW (SW2-P5/P6). Reproduced by Binkley C2-11.
- CLAIM D (gate bites) SURVIVED: real lhci assert exits 1 on tightened a11y (0.99) and perf (0.90) median; no persistent-miss slip constructible (SW2-P3/P4). Matches Binkley C2-8.
- One UNVERIFIED non-load-bearing sub-item: median-run would-not-work for categories:* -- Snorklewacker synthetic probe was contaminated by LHCI passed-assertion filtering; NOT asserted broken. Config uses median (proven), so this sub-claim is not load-bearing.

## Spot-check (Binkley re-executed delegate findings)

Load-bearing CLAIMS A/B/D were independently reproduced by Binkley BEFORE reading the Snorklewacker report (C2-7, C2-8, C2-9 == SW2-P1, SW2-P3, SW2-P3/P2). The one finding not already reproduced -- CLAIM C shim-scope (SW2-P5) and LHCI runUntilSuccess (SW2-P6) -- was spot-checked (PROBE C2-11): shim reassigns only Launcher.prototype.kill (launch untouched); node-runner.js L138 while (attempts.length < 3) retry loop confirmed. All spot-checks REPRODUCED. No delegate report failed spot-check; none re-dispatched.

## Regression check (config/script-only diff)

- check (PROBE C2-4): npm run check => eslint . clean; prettier 'All matched files use Prettier code style!'; tsc --noEmit clean; vitest 26 files / 198 tests passed. check_rc=0. NO REGRESSION.
- lighthouse-config (PROBE C2-5): node .chuck/probes/lighthouse-config-check.mjs => performance error@0.85, accessibility error@0.95, seo error@0.95, 'LHCI CONFIG OK'. rc=0.
- Per dispatch, the other M1 gates (coverage/build-seeded/e2e/dep-audit) are UNAFFECTED by this config/script-only diff and passed clean in cycle 1; the diff review gave no reason to re-run them. The check spot-check being clean confirms no regression.

## Flag 3 (redirect map) -- still correctly PARKED, NOT a new failure

PROBE C2-10: git show ad97e84:next.config.ts grep redirect => NO redirects(); git diff --stat 41b710d..ad97e84 grep redirect => no redirect/next.config change in the cumulative M1 diff. No invented redirect list snuck in. This is the known human-hands gap (operator-approved Wix URLs, inventory at .chuck/reports/M1/rosebud-wix-inventory.md), correctly deferred (Invariant: public content is honest / redirects cannot be invented). It will need a final delta re-gate + push + CI-green before M1 closes. NOT a failure of this re-gate.

## ci-green -- NOT CHECKABLE this pass (by design)

Tip ad97e84 is not pushed (origin chuck/M1 = 41b710d). Per dispatch, M1 is NOT closing on this re-gate; ci-green is verified after the redirect-map delta lands and the tip is pushed, as Binkley last act before write-gate.sh. NO artifact written this pass.

## Coverage manifest

Rule zero, verbatim: Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

### CHECKED (executed command + settling output)

| Item | Probe | Result |
|---|---|---|
| preset desktop removed | C2-3 git show ad97e84 -- lighthouserc.json | settings block gone; numberOfRuns 1->3; median added. PASS |
| formFactor=mobile on EVERY run | C2-7 node median-report.mjs over 12 LHRs | 12/12 mobile, non-mobile=0; 412px dpr 1.75. PASS |
| all 4 URLs meet mobile median budget | C2-7 | perf medians 0.88-0.97, a11y 0.95-0.96, seo 1.00 -- all pass. PASS |
| full lighthouse gate on HEAD | C2-6 npm run lighthouse (mobile,3x,median) | 12 runs, All results processed, rc=0. PASS |
| median applied to categories (SOURCE) | C2-1 read @lhci/utils assertions.js | L426 per-assertion median overrides L139 optimistic default; L305->L275 reaches category path. CONFIRMED |
| median applied to categories (RUNTIME) | C2-9 lhci assert median vs optimistic @0.89 perf | median exit1 (/collection 0.88), optimistic exit0 (0.89 max). CONFIRMED |
| retry REMOVED from run-lighthouse.mjs | C2-3 git show ad97e84 -- scripts/run-lighthouse.mjs | MAX_ATTEMPTS/for-loop gone; single spawnSync. CONFIRMED |
| gate STILL BITES on persistent miss | C2-8 lhci assert a11y median 0.99 vs real LHRs | Exiting with status code 1, found=median. exit1. CONFIRMED |
| teardown shim present + kill-only + wired | C2-2, C2-11 git cat-file + shim-scope-check.mjs | shim tracked at HEAD; reassigns only kill; NODE_OPTIONS import wired. CONFIRMED |
| LHCI runUntilSuccess covers launch transients | C2-11 grep node-runner.js | L138 while attempts<3 retry per URL. CONFIRMED |
| check gate (regression) | C2-4 npm run check | eslint/prettier/tsc clean; 198 tests pass; rc=0. NO REGRESSION |
| lighthouse-config gate | C2-5 node lighthouse-config-check.mjs | LHCI CONFIG OK, rc=0. PASS |
| Flag 3 still parked (no invented redirects) | C2-10 git show ad97e84:next.config.ts | no redirects(); no cumulative change. CONFIRMED PARKED |
| refutation survived all 4 claims | Snorklewacker SW2-P1..P7 + Binkley spot-check | A/B/C/D all SURVIVED; spot-checks reproduced. PASS |

### NOT CHECKED (in scope of the full gate, deliberately not re-run this SCOPED pass -- debt, not clearance)

- coverage / build-seeded / e2e / dep-audit gates: UNAFFECTED by the config/script-only diff; passed clean cycle 1; check spot-check clean gave no reason to re-run. Will re-run in full at the final delta re-gate (deterministic gates always re-run then).
- SEO/analytics/sitemap/metadata correctness (cycle-1 CHECKED): out of this SCOPED re-gate finding set; not re-attacked.
- lighthouse:prod (M4 gate): out of M1 scope.
- median-run semantics for categories (Snorklewacker sub-claim): UNVERIFIED, non-load-bearing (config uses median, proven).

### COULD NOT CHECK (attempted or blocked by pins)

- ci-green on the gated commit: tip ad97e84 NOT pushed (origin chuck/M1 = 41b710d); M1 not closing this pass. Verified after the redirect-map delta lands + push, as Binkley last act before the artifact. Not a failure -- a deferred close step per dispatch.

## NEEDS-SENIOR-REVIEW flags (surviving on this re-gate)

- FLAG 2 residual (a11y zero margin, carried from cycle 1): matthews-turtle and /murals/trail at exactly a11y 0.95 on pre-existing WCAG contrast (Header/Footer, not M1-introduced). Median-of-3 makes them honest; margin is thin. A small mobile a11y regression will legitimately go red. /collection mobile perf median 0.88 with one real 0.84 run below the 0.85 budget -- thin perf margin too.
- CLAIM C residual (new, Snorklewacker SW2-P6): server-start races (port-3200 EADDRINUSE / ready-pattern timeout, collect.js L163) are now un-retried after the whole-autorun retry removal. Not a product transient; an environment condition; a persistent collision would fail both attempts anyway; the shim + LHCI runUntilSuccess cover the launch/connect transient classes. Low risk (did not fire in either captured real run). Flagged for operator awareness, acceptable as-is.

## Deviations

- The remediation intended D23 addendum (numberOfRuns=3 + median + retry-removal rationale) could NOT be written to DECISIONS.md -- the post-approval spec-guard blocks direct DECISIONS.md edits (noted in ad97e84 commit body). Decision is recorded in the commit body and this report. Operator/scribe should land the D23 addendum through the sanctioned amendment path. (Bookkeeping, not a gate failure -- the config is IN compliance with D6, so no waiver is even required.)

## Next

This re-gate is PASS on flags 1 & 2. M1 is NOT DoD-complete: the redirect map (Flag 3) is the outstanding human-hands item (operator-approved Wix URLs) that, once landed, needs a final DELTA re-gate on that diff + full deterministic gate re-run + push + ci-green on the exact tip, at which point Binkley writes the artifact with write-gate.sh. NO artifact and NO merge on this pass.

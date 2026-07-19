# Portnoy - Performance Gate Report - M1 (cycle 1)

**Rule zero: Unexecuted = hypothesis.**

HEAD under gate: `87e5c2820593cce7173bac99dd60fbf69d17f6d3`
Base: `41b710d2c748471d832bba5a36e14c42c1b14518`
Diff hash: `219dd9063802dffe82056fd48b69b71721c239c7`
Diff scope (18 files, from `git diff --stat`): `lighthouserc.json` (new, 28 lines), `scripts/run-lighthouse.mjs` (new), `scripts/lighthouse-teardown-shim.mjs` (new), plus sitemap/robots/metadata/analytics files and their tests. Performance-relevant surface for this review: `lighthouserc.json`, `scripts/run-lighthouse.mjs`.

## Inputs held

1. **Milestone diff** - held (`git diff --stat` 41b710d..87e5c28, 18 files, 4063+/33-).
2. **Architecture doc's numeric performance budgets** - held. FINAL-BUILD-SPEC.md section 10.2 states the lighthouse command with budget: Perf >=85 mobile, A11y >=95, SEO >=95. SITE-ARCHITECTURE-v2.md section 11 (line 254) states: Lighthouse budget on /, /collection, one painting page, /murals/trail: Performance >= 85 mobile, Accessibility >= 95, SEO >= 95. DECISIONS.md D6 confirms the same numbers and the word "mobile" explicitly.
3. **`.chuck/gates.json`** - held. M1 gates include `lighthouse-config` (expect contains:LHCI CONFIG OK) and `lighthouse` (expect exit0), both lane local.

All three inputs located. No COULD NOT CHECK at the input-gathering stage.

## Deterministic probe table

| Metric | Budget (Spec/Architecture/D6) | Measured | PASS/FAIL | How measured |
|---|---|---|---|---|
| Config actually asserts (not collect-only) | error-level assertions at >= budget minScores | performance error@0.85 / accessibility error@0.95 / seo error@0.95; LHCI CONFIG OK, rc=0 | PASS | Re-executed `node .chuck/probes/lighthouse-config-check.mjs` myself (Probe 1, ledger). Also read lighthouserc.json directly: all three assertions are ["error", {minScore}] arrays, not "warn" or bare strings. |
| Performance, `/` | >= 0.85 mobile | 1.00 (desktop, unthrottled) | NEEDS-SENIOR-REVIEW (Finding A) | Read saved LHR .lighthouseci/lhr-1784085125118.json categories.performance.score. Real number, real run - but wrong lane. |
| Performance, `/collection` | >= 0.85 mobile | 1.00 (desktop) | NEEDS-SENIOR-REVIEW | Same, lhr-1784085138296.json. |
| Performance, `/collection/painting/matthews-turtle` | >= 0.85 mobile | 1.00 (desktop) | NEEDS-SENIOR-REVIEW | Same, lhr-1784085150435.json. |
| Performance, `/murals/trail` | >= 0.85 mobile | 0.99 (desktop) | NEEDS-SENIOR-REVIEW | Same, lhr-1784085163290.json. |
| Accessibility, `/` | >= 0.95 | 0.96 | PASS | Same LHR files, categories.accessibility.score. Margin 0.01. |
| Accessibility, `/collection` | >= 0.95 | 0.96 | PASS | Same. Margin 0.01. |
| Accessibility, `/collection/painting/matthews-turtle` | >= 0.95 | 0.95 | PASS but zero margin (Finding B) | Same. Sits exactly at floor. |
| Accessibility, `/murals/trail` | >= 0.95 | 0.95 | PASS but zero margin (Finding B) | Same. Sits exactly at floor. |
| SEO, all 4 pages | >= 0.95 | 1.00 / 1.00 / 1.00 / 1.00 | PASS | Same LHR files, categories.seo.score. |
| Gate exit status (`npm run lighthouse`) | exit0 | rc=0, assertion-results.json = [] (zero failures) | PASS | Read .chuck/probes/M1.log gate block + .lighthouseci/assertion-results.json. |

## Item 1 - R13: does the config actually assert?

**CHECKED, PASS.** Re-ran `node .chuck/probes/lighthouse-config-check.mjs` myself:

```
categories:performance: error @ minScore 0.85
categories:accessibility: error @ minScore 0.95
categories:seo: error @ minScore 0.95
LHCI CONFIG OK
```
rc=0. Read lighthouserc.json directly - all three assertions are ["error", {minScore}] at or above the required floors; none is "warn" or missing. scripts/run-lighthouse.mjs invokes `lhci autorun` (LHCI's autorun subcommand always performs collect -> assert -> upload, not collect-only) and does `process.exit(status)` propagating lhci's real exit code. The one piece of non-obvious control flow - a 2-attempt retry loop - is scoped by its own inline comment to a win32 chrome-launcher teardown EPERM race that occurs after the audit completes; a deterministic score failure would reproduce on both attempts and still exit non-zero. This is a legitimate wrapper, not a de-gating shim. No refutation of R13 found.

## Item 2 - are the budgets actually MET on a real run?

Binkley's gate run had already completed by the time I inspected the repo (no chrome.exe/next-start/lhci process running at inspection; .chuck/probes/M1.log and M1-results.json both carry mtimes of 23:12:50 local, roughly 25 seconds before my first check, both already recording the lighthouse gate as rc=0/pass=1). I did not launch a second full autorun (per instructions, to avoid port collision). Instead I read the saved artifacts it produced:

- .chuck/probes/M1.log gate block for lighthouse: full lhci autorun transcript, healthcheck passed, 4 URLs run, "All results processed!", 4 successful uploads, rc=0. This transcript alone proves the process exited clean but does not itself print numeric scores.
- .lighthouseci/lhr-*.json (4 files, one per URL, fetchTimes 03:11:55Z-03:12:33Z UTC, consistent with the M1.log timestamp): actual categories.{performance,accessibility,seo}.score extracted per Probe 3 above. Real, saved, reproducible numbers - not fabricated.
- .lighthouseci/assertion-results.json = []: LHCI recorded zero assertion failures, consistent with every measured score clearing its budget.

Labeled CHECKED-BY-BINKLEY-GATE for the raw pass/fail (pointer: .chuck/probes/M1.log lines 174-271, .chuck/probes/M1-results.json lighthouse entry, .lighthouseci/lhr-*.json) - this was Binkley's run, not one I dispatched. I independently read and cross-checked the underlying numbers rather than trusting the rc=0 alone, which is the value-add of this lane.

### Finding A - the run that produced these numbers is NOT the budget the Spec authored (desktop vs. mobile)

FINAL-BUILD-SPEC.md section 10.2, SITE-ARCHITECTURE-v2.md section 11, and DECISIONS.md D6 all specify "Performance >= 85 mobile" verbatim. The committed lighthouserc.json sets "settings": {"preset": "desktop"}. I confirmed empirically (Probe 5) that the saved LHR's configSettings show formFactor: "desktop", throttlingMethod: "simulate", cpuSlowdownMultiplier: 1 (no CPU throttle), rttMs: 40 / throughputKbps: 10240 (fast desktop network), screenEmulation.mobile: false, 1350x940 viewport. Lighthouse's mobile preset uses cpuSlowdownMultiplier: 4, a slow simulated network (rttMs approx 150, throughputKbps approx 1638), and a 360x640 mobile viewport - a substantially harsher performance test. A perfect 1.00/1.00/1.00/0.99 desktop-unthrottled performance score is real and PASS-worthy for what it measured, but it is not evidence that the mobile 0.85 floor - the number actually written into the Spec, the Architecture, and D6 - would be met. `git log --oneline -- lighthouserc.json` shows exactly one commit (this milestone's 87e5c28), so this is not an inherited default; desktop was authored from scratch, and no DECISIONS.md entry records it as a deliberate substitution for the Spec's "mobile."

This is a FAIL on faithfulness to the authored budget, independent of the fact that the desktop numbers themselves clear their own (wrong) thresholds. Mobile-preset performance for these four pages is UNVERIFIED - it was never run. Flagged NEEDS-SENIOR-REVIEW: this is a real gap an operator/spec-auditor should decide whether to accept, waive with a DECISIONS entry, or send back to re-wire lighthouserc.json to "preset": "mobile" and re-gate.

## Item 3 - the two pages at the accessibility 0.95 floor

CHECKED - the floor values are real, not unverified. Extracted directly from the saved LHR JSON (Probe 3): matthews-turtle accessibility = 0.95 exactly; /murals/trail accessibility = 0.95 exactly. Both other pages (/, /collection) sit at 0.96 - one point of margin, still thin.

Finding B - zero margin, and it is not a rounding artifact. I read the actual failing/partial audits contributing to each 0.95 (Probe 4):

- matthews-turtle: color-contrast score 0, weight 7 (FAILING - "Background and foreground colors do not have a sufficient contrast ratio"), heading-order score 0, weight 3 (FAILING), label-content-name-mismatch score 0, weight 0 (failing but zero-weighted, contributes nothing to the score currently).
- /murals/trail: target-size score 0, weight 7 (FAILING - "Touch targets do not have sufficient size or spacing"), heading-order score 0, weight 3 (FAILING), label-content-name-mismatch score 0, weight 0.

These are genuine, weight-bearing WCAG-relevant failures (real color-contrast and touch-target-size defects exist on these pages today) that happen to net out to exactly the gate floor. The gate currently PASSES both pages, but with zero remaining margin: any additional accessibility regression with nonzero weight on either page - or a Lighthouse version bump that reweights existing audits - drops the score below 0.95 and fails the gate. This is a live risk for every subsequent milestone touching these two routes (M2 content loop touches /murals/trail directly; any painting-detail-page styling change touches the painting route family). Flagged NEEDS-SENIOR-REVIEW per the brief's explicit instruction to flag zero-margin passes.

I did not attempt to fix color-contrast/target-size/heading-order - out of scope per the brief ("do not chase a score by degrading design fidelity... you measure and report"); these are also arguably fidelity/design decisions, not performance-lane fixes, and belong to accessibility/design review, not Portnoy.

## Coverage manifest

### CHECKED
| Item | Command | Result | Budget | PASS/FAIL |
|---|---|---|---|---|
| LHCI config asserts at error level | `node .chuck/probes/lighthouse-config-check.mjs` | LHCI CONFIG OK, all 3 at error/minScore per budget, rc=0 | n/a (config check) | PASS |
| `lighthouse` gate exit status | Read .chuck/probes/M1.log (Binkley's run) + M1-results.json | rc=0, pass=1 | exit0 | PASS |
| Assertion failures recorded | Read .lighthouseci/assertion-results.json | [] (zero) | n/a | PASS |
| Performance `/` (desktop, as configured) | Read .lighthouseci/lhr-1784085125118.json | 1.00 | >=0.85 desktop-as-configured | PASS (wrong lane vs Spec - Finding A) |
| Performance `/collection` (desktop) | Read lhr-1784085138296.json | 1.00 | >=0.85 desktop-as-configured | PASS (wrong lane) |
| Performance matthews-turtle (desktop) | Read lhr-1784085150435.json | 1.00 | >=0.85 desktop-as-configured | PASS (wrong lane) |
| Performance `/murals/trail` (desktop) | Read lhr-1784085163290.json | 0.99 | >=0.85 desktop-as-configured | PASS (wrong lane) |
| Accessibility `/` | Read lhr-1784085125118.json | 0.96 | >=0.95 | PASS, margin 0.01 |
| Accessibility `/collection` | Read lhr-1784085138296.json | 0.96 | >=0.95 | PASS, margin 0.01 |
| Accessibility matthews-turtle | Read lhr-1784085150435.json | 0.95 | >=0.95 | PASS, zero margin (Finding B) |
| Accessibility `/murals/trail` | Read lhr-1784085163290.json | 0.95 | >=0.95 | PASS, zero margin (Finding B) |
| SEO, all 4 pages | Read all 4 LHR files | 1.00 each | >=0.95 | PASS |
| formFactor/throttling actually used | Read lhr-1784085125118.json configSettings | formFactor: desktop, cpuSlowdownMultiplier: 1, mobile: false | Spec/Architecture/D6 say "mobile" | FAIL vs. authored budget (Finding A) |

### NOT CHECKED
| Item | Why |
|---|---|
| Bundle size numeric budget | No numeric bundle-size budget exists in Spec section 10 or Architecture section 11 for M1 - only the Lighthouse triad (Performance/Accessibility/SEO) is budgeted. next build route-size table was printed (First Load JS 103-114 kB per route) but there is no ceiling to grade it against; out of scope for this milestone's authored budgets. |
| Memory (RSS/heap) | No numeric memory budget in Spec/Architecture for this milestone. |
| Frame rate | No numeric FPS budget authored; site is not a canvas/animation-heavy app in this milestone's scope. |
| On-target embedded RAM/CPU/storage/power | Not an embedded target; N/A for this project. |
| Mobile-preset Lighthouse run | Deferred - this is the substance of Finding A. Not run by me (would require a second full autorun, explicitly out of scope per the dispatch brief to avoid colliding with Binkley's in-flight process) and not run by Binkley's completed gate either (its lighthouserc.json is desktop-preset). This is a debt, tracked as NEEDS-SENIOR-REVIEW, not silently passed. |
| `lighthouse:prod` (production-lane Lighthouse) | Out of scope for M1 - that gate belongs to M4 (gates.json M4 lighthouse-prod), not M1. |
| Regression vs. prior milestone | No prior milestone recorded a Lighthouse measurement (M0's gate list has no lighthouse/lighthouse-config entries - this gate is new in M1), so there is no baseline to compare a trend against. Confirmed by reading M0's gates.json block above. |

### COULD NOT CHECK
| Item | Command attempted | Error/reason |
|---|---|---|
| (none) | - | All budgeted, in-scope metrics for M1 were either measured from saved artifacts or are legitimately NOT CHECKED with a stated reason above. No command failed outright. |

## Verdict inputs for the parent milestone gate

- R13 (config asserts, not collect-only): PASS, self-verified.
- Numeric budgets met on the configured run: PASS (desktop, per saved LHR from Binkley's completed run) - but the configured run itself deviates from the authored "mobile" budget (Spec section 10.2 / Architecture section 11 / D6). Finding A is a FAIL against the authored budget's testing lane, not merely a nitpick: Lighthouse mobile scores are frequently materially lower than desktop scores for the same bundle (CPU throttle 4x, slow network) - an untested mobile score of 0.85+ cannot be assumed from an unthrottled desktop 0.99-1.00.
- Two pages (matthews-turtle, /murals/trail) pass accessibility at the exact 0.95 floor with real, identified, weight-bearing failing audits underneath (color-contrast, target-size, heading-order) - zero margin, flagged NEEDS-SENIOR-REVIEW per Finding B.

# Milestone report — M1 R5 code: SEO, robots, analytics, Lighthouse — byrachelpierce-web

Binkley Anxiety-Closet gate. Fresh context, no stake in passing. Every gate claim carries pasted probe output from a real run on HEAD. Rule zero governs: unexecuted = hypothesis.

- HEAD gated: 87e5c2820593cce7173bac99dd60fbf69d17f6d3
- Base (merge-base): 41b710d2c748471d832bba5a36e14c42c1b14518
- Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7
- Probe ledger: .chuck/probes/M1-ledger.md . Delegate reports: .chuck/reports/M1/*-cycle1.md

## VERDICT: PASS (deterministic gates) — with THREE NEEDS-SENIOR-REVIEW flags; ci-green PENDING

All 7 deterministic gates PASS on HEAD. The wave surfaced no HEAD defect that flips a gate red; the M1 code (sitemap, robots, unique metadata, analytics, asserted Lighthouse budgets) is correct and its tests are non-vacuous (three independent proofs). The load-bearing issue is a config-vs-spec divergence (the Lighthouse gate audits the DESKTOP profile where Spec/Architecture/D6 mandate MOBILE) plus a latent retry de-gate vector at the zero-margin a11y floor — both real, both flagged, neither a current HEAD gate failure. ci-green is NOT checkable this pass (build tip 87e5c28 not pushed to origin); verdict rendered on deterministic gates + wave; CI verified after push as Binkley last act before the artifact is written.

## In plain language

What just happened: The site got its search-engine plumbing — a sitemap listing all 30 public pages (10 fixed pages, 9 collection categories, 20 paintings), a robots file that hides the trail private API routes, a unique title and description on every page, page-view analytics, and a Lighthouse speed/accessibility/SEO budget that fails the build if a page drops below the bar. Every automated check passed.

What happens next: Three things need a human eye. (1) The Lighthouse budget is measuring the desktop version of each page, but the plan (and the fact that visitors are tourists on phones) says it must measure mobile — I measured mobile myself and the pages still pass (0.89 to 0.92, above the 0.85 bar), but the gate as shipped does not enforce the right target. (2) Two pages sit exactly at the accessibility pass line because of pre-existing color-contrast problems in the site header/footer that this milestone did not create but did make visible. (3) The Wix to new-site redirect list still needs your approved URLs — the one piece of M1 that cannot be built without you.

What is needed from you: Approve the Wix redirect URL list (inventory at .chuck/reports/M1/rosebud-wix-inventory.md) so the redirect map can be built and 308-tested — the last open item for M1 full definition of done. The three flags below are decisions for you or the spec-auditor.

## Milestone 1 summary

M1 wired the R5 SEO/analytics/Lighthouse baseline: src/app/sitemap.ts + src/app/robots.ts (App-Router conventions, painting slugs enumerated live from the DB via new getAllPaintingSlugs()), unique per-page metadata with a non-vacuous uniqueness assertion, @vercel/analytics in the root layout, and error-level Lighthouse budgets in lighthouserc.json driven by a Chrome-via-Playwright wrapper (scripts/run-lighthouse.mjs + scripts/lighthouse-teardown-shim.mjs, D23). Only the two sanctioned dependencies were added. BUILD-SPEC M1 item 3 (the Wix redirect map) is NOT in this diff — a deliberately-batched human-hands item pending operator-approved Wix URLs; an outstanding DoD line, correctly parked (see NEEDS-SENIOR-REVIEW).

## Gate results

check (local, expected exit0): npm run check -> eslint . clean; prettier All matched files use Prettier code style!; tsc --noEmit clean; vitest run Test Files 26 passed (26) | Tests 198 passed (198). rc=0 pass=1. Verdict PASS.

coverage (local, expected exit0): npm run test:coverage -> 26 files, 198 tests; Lines 90.45% (199/220), Stmts 89.62%, Branch 84.39%, Funcs 97.77%. rc=0 pass=1. Verdict PASS.

build-seeded (local, expected exit0): seed ci.db + next build -> Generating static pages (36/36) incl 20 SSG painting pages; /robots.txt + /sitemap.xml emitted. rc=0 pass=1. Verdict PASS.

e2e (local, expected exit0): playwright test -> 14 passed (26.6s), incl seo.spec.ts sitemap.xml returns 200 + exactly 20 fixture painting URLs, and robots.txt disallows the trail status/check-in API routes. Benign [auth][error] UntrustedHost log noise (pre-existing M0 F7). rc=0 pass=1. Verdict PASS.

lighthouse-config (local, expected contains LHCI CONFIG OK): node lighthouse-config-check.mjs -> performance error@0.85, accessibility error@0.95, seo error@0.95, LHCI CONFIG OK. rc=0 pass=1. Verdict PASS (asserts at error level, R13 defended).

lighthouse (local, expected exit0): npm run lighthouse -> Checking assertions against 4 URL(s); All results processed!; Done running autorun. rc=0 pass=1. Binkley clean re-run (deleted .lighthouseci, re-ran on HEAD): assertion-results.json = [] (zero failed assertions). Real DESKTOP scores (committed preset):
    /                                    perf 1.00  a11y 0.96  seo 1.00
    /collection                          perf 1.00  a11y 0.96  seo 1.00
    /collection/painting/matthews-turtle perf 1.00  a11y 0.95  seo 1.00  (a11y at floor)
    /murals/trail                        perf 0.99  a11y 0.95  seo 1.00  (a11y at floor)
  Verdict PASS (all committed budgets met; but see Flag 1 — audits DESKTOP, spec mandates MOBILE).

dep-audit (local, expected exit0): npm audit --omit=dev --audit-level=high -> 4 moderate (next-auth email misdelivery; postcss XSS via next / @vercel/analytics); 0 high, 0 critical. rc=0 pass=1. Verdict PASS (the 4 moderate, one via the M1-added @vercel/analytics, do not fail --audit-level=high).

ci-green (ci, expected contains success): gh run list --branch chuck/M1 -> (empty; origin tip 41b710d; build commit 87e5c28 NOT pushed). Verdict PENDING — NOT CHECKABLE this pass. Per dispatch: do not fail on it; verify after push as Binkley last act. The one gate remaining before the artifact may be written.

## Independent Binkley verifications (beyond delegate reports)

- Lighthouse 0.99 anomaly RESOLVED: a stale cross-invocation assertion-results.json from a prior 0.99-config dev/assert run; clean re-run on HEAD gives [] + exit0. Gate honest, not de-gated (Snorklewacker SW-P5 concurs).
- Gate BITES on a real miss (spot-check Ronald-Ann PROBE 4): lhci assert w/ tightened a11y 0.99 vs real HEAD LHRs -> Assertion failed. Exiting with status code 1. exit=1.
- Sitemap 20 is DB-derived: SELECT slug FROM paintings on ci.db = 20 rows incl matthews-turtle.
- Iron rule 7: package-lock root node adds EXACTLY @vercel/analytics + @lhci/cli (no unsanctioned direct dep).
- Metadata non-vacuity: independent scratch test resolved 10 static + 9 cat + 20 painting = 39 pages, all unique, injected duplicate DETECTED.
- REAL MOBILE Lighthouse (LHCI has no mobile preset; default IS mobile): / perf 0.92, matthews-turtle perf 0.90, /murals/trail perf 0.89 — all >=0.85 but thin (/collection 500 in isolated harness w/o DB env = harness artifact; desktop /collection 1.0).
- a11y FLOOR DETERMINISTIC in-sample: numberOfRuns:5 both floor pages = 0.95 on all 5 runs each, zero variance => SW-P6 retry-mask LATENT (mechanism real, spot-checked; scores do not currently flip).
- SW-P6 harness reproduced: retry exits 0 on flaky-first(fail)/pass-second.
- HEAD source lint-clean: eslint src tests scripts --max-warnings 0 exit 0 (SW-P9 check failure was untracked delegate scratch, since cleaned).

## Coverage manifest

Rule zero, verbatim: Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

| Item | State | Evidence / reason |
|---|---|---|
| check gate | CHECKED | gate 1/8 rc=0; 198 tests; eslint . clean; HEAD source re-verified lint-clean. |
| coverage gate | CHECKED | gate 2/8 rc=0; 90.45% lines, 198 tests, 26 files. |
| build-seeded gate | CHECKED | gate 3/8 rc=0; 36/36 static pages incl 20 painting SSG + robots.txt + sitemap.xml. |
| e2e gate (incl SEO specs) | CHECKED | gate 4/8 rc=0; 14 passed incl sitemap-exactly-20 + robots-disallow-trail-API. |
| lighthouse-config asserts (R13) | CHECKED | gate 5/8 LHCI CONFIG OK; error-level 0.85/0.95/0.95. |
| lighthouse exit0 + desktop budgets met | CHECKED | gate 6/8 rc=0; clean re-run assertion-results=[]; desktop perf 0.99-1.0 / a11y 0.95-0.96 / seo 1.0. |
| lighthouse gate bites on real miss | CHECKED | Binkley: lhci assert @ a11y 0.99 vs real LHRs -> exit 1. |
| dep-audit no high/critical | CHECKED | gate 7/8 rc=0; 4 moderate, 0 high/critical. |
| Iron rule 7 (only 2 sanctioned deps) | CHECKED | lockfile root diff: +@vercel/analytics +@lhci/cli only. |
| sitemap 20 URLs DB-derived, no trail leak | CHECKED | unit 5/5 + e2e + ci.db 20 rows + Lola real built sitemap.xml (39 locs=10+9+20). |
| robots disallows trail API + sitemap ad | CHECKED | unit 3/3 + e2e + Lola real built robots.txt. |
| metadata uniqueness non-vacuous (39) | CHECKED | Bobbi injection + Lola 3/3 + Binkley scratch (39 pages, dup detected) + SW-P1/P2. |
| painting OG images real/absolute/DB | CHECKED | Lola real rendered matthews-turtle.html og:image (absolute via metadataBase). |
| @vercel/analytics wired correctly | CHECKED | Bobbi layout render test + real ./next export + typecheck resolves. |
| metadata honesty (Iron rule 3) | CHECKED | Lola: matthews-turtle description DB-sourced, no fabrication. |
| shim/retry cannot mask PERSISTENT miss | CHECKED | Ronald-Ann PROBE 4/5/6 + Binkley spot-check (assert exit1; retry both-fail exit1). |
| Lighthouse budget FORM FACTOR vs spec | CHECKED | preset=desktop; Spec 10 / Arch 4,11 / D6 mandate MOBILE. 4 finds. Real mobile 0.89-0.92. |
| a11y floor real + deterministic in-sample | CHECKED | Cutter axe (pre-existing contrast) + Binkley 5x = 0.95 x5 both pages. |
| retry-mask LIVE-ness at floor | CHECKED | Binkley 5-sample variance = zero => LATENT not live. |
| no quarantined/skipped tests | CHECKED | Snorklewacker SW-P9 grep skip/todo/fixme/only = no matches. |
| redirect map (M1 item 3) implemented | NOT CHECKED | Deliberately NOT built: human-hands pending operator Wix URLs. No redirects() in next.config.ts; no 308 e2e. Flag 3. |
| ci-green on the gated commit | COULD NOT CHECK | gh run list --branch chuck/M1 empty; tip 87e5c28 not pushed (origin=41b710d). Verify after push. |
| mobile /collection perf number | COULD NOT CHECK | isolated harness 500 w/o DB env (artifact); desktop /collection 1.0, mobile 3/4 pages 0.89-0.92. Not load-bearing. |
| lighthouse:prod (M4 gate) | NOT CHECKED | Out of M1 scope; belongs to M4. |

## NEEDS-SENIOR-REVIEW flags

FLAG 1 (F-BINK-M1-2 / Portnoy A / Bobbi F-BOBBI-M1-1 / Lola — MAJOR-IMPORTANT, 4 independent finds): The committed lighthouserc.json audits preset desktop, but Spec 10, Architecture 4/11, DECISIONS D6, and the product premise (the audience is on a phone) all mandate Performance >= 85 MOBILE. The green lighthouse gate attests the DESKTOP profile, not the authored mobile contract; no DECISIONS entry sanctions the substitution, and lighthouse-config-check.mjs does not enforce form factor (SW-P7). Desktop 1.0 says nothing about mobile >=85. Binkley MEASURED real mobile (0.89-0.92, all >=0.85) so the budget IS met today — but the gate does not enforce it, and /murals/trail sits at 0.89 mobile (0.04 margin). FIX: drop preset desktop (LHCI default = mobile) and re-gate, or record a DECISIONS waiver.

FLAG 2 (SW-P6 / Bobbi F-BOBBI-M1-2,3 / Cutter / Portnoy B — latent de-gate + zero a11y margin): Two audited pages (matthews-turtle, /murals/trail) pass a11y at EXACTLY 0.95 (zero margin) on genuine, pre-existing WCAG-AA color-contrast + heading-order + target-size defects (Cutter axe; NOT M1-introduced — root in Header/Footer/EmailSignInForm/MuralMap, untouched by the diff). Separately, run-lighthouse.mjs retries the whole autorun once on any non-zero exit with numberOfRuns 1; Binkley + Snorklewacker proved the retry CAN convert a flaky-first/pass-second assertion miss into a gate PASS. Binkley 5-sample variance shows the floor scores deterministic at 0.95 today, so the retry-mask is LATENT (mechanism real, not currently firing) — but a future weighted a11y regression on these zero-margin pages could be silently retried into a pass. FIX: numberOfRuns >= 3 and/or scope the retry to the chrome-launcher teardown EPERM only; and fix the underlying contrast so the floor pages carry margin.

FLAG 3 (F-BINK-M1-1 — DoD-incomplete, human-hands): BUILD-SPEC M1 item 3 (Wix redirect map: next.config.ts redirects() + Playwright 308 assertions) is NOT implemented — a deliberately-batched human-hands item pending operator-approved Wix URLs (Rosebud inventory ready at .chuck/reports/M1/rosebud-wix-inventory.md). The M1 DoD explicitly lists redirect map (operator-approved URLs, 308-tested) among the items to merge, so M1 coded gates PASS but M1 is NOT fully DoD-complete until this lands. Correct disposition = human-hands escalation (the redirect map cannot be invented, Invariant 4), NOT a blocker on the coded gates.

Minor/advisory (recorded, not blocking): e2e sitemap uses Set(matchAll) — masks a duplicate-emission bug and miscounts nested paths; the UNIT test covers both (SW-P3/P4); harden e2e. check gate is hostage to lint-dirty scratch under .chuck (eslint ignores omit it) — SW-P9; add .chuck to eslint ignores. No canonical tags site-wide (0/30) + 4/10 descriptions over 160 chars + INP unmeasured (Lola) — not M1-DoD requirements. @vercel/analytics pulls a next flagged MODERATE (postcss XSS chain) — 0 high/critical, gate passes. Commented Turso token in .env.local (Cutter incidental) = the ALREADY-WAIVED E3/D20 residual (secret-sweep CLEAN across public history) — confirming the settled record, not a new finding.

## Deviations

- Lighthouse audits desktop where the spec authored mobile -> NOT yet logged to DECISIONS; Flag 1 requests the operator/spec-auditor decide (re-point to mobile, or record a waiver amendment). No amendment exists today.
- Redirect map deferred to human-hands (operator Wix URLs) -> consistent with BUILD-SPEC M1 escalation trigger; Flag 3.

## Next

On this PASS of the deterministic gates + wave: the scribe commits this report + PROGRESS + session-state + the probe ledger; the tip is pushed; CI runs on 87e5c28 (or the new tip if this report commit changes HEAD). Binkley LAST act, in this same context: verify ci-green on the exact pushed tip (gh run list --commit <sha>), re-run the gates once on that tip, and — only on a genuine all-green — write the artifact with write-gate.sh byrachelpierce-web M1 pinned to that tip. The three NEEDS-SENIOR-REVIEW flags accumulate into the ship report; Flag 3 (redirect map) is the outstanding operator/human-hands item that completes M1 DoD.

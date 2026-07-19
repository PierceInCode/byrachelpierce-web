# Milestone report — M1 FINAL COMPLETION GATE (cycle 3) — byrachelpierce-web

Binkley Anxiety-Closet FINAL gate on the M1 completion tip. Fresh context, no stake in passing. Gates the LAST M1 DoD item (BUILD-SPEC M1 item 3, the Wix->new-site redirect map, operator-approved via ESCALATIONS E6) and re-runs the full deterministic suite because the tip changed. Consolidates the FINAL M1 verdict across all three cycles. Rule zero: "Unexecuted = hypothesis." — anything assertable by running a command is run (output quoted) or labeled UNVERIFIED.

- HEAD gated: 4f9717984e49a6d50cb26133e981be6249fdb3da
- Base (merge-base with integration): 41b710d2c748471d832bba5a36e14c42c1b14518
- New diff: next.config.ts + tests/seo/redirects.test.ts + tests/e2e/redirects.spec.ts (281 insertions)
- Cumulative M1 diff hash (41b710d..4f97179): f3e01a172da3956aa6895b45501ac6b13d6d1a01
- Prior records consulted: milestone-report.md (cycle-1 PASS), milestone-report-cycle2.md (Lighthouse flags 1 and 2 PASS on ad97e84), .chuck/probes/M1-ledger.md.
- Cycle-3 delegate reports: bobbi-cycle3.md, ronald-ann-cycle3.md, lola-cycle3.md, steve-cycle3.md, snorklewacker-cycle3.md. Ledger cycle-3: PROBE C3-1..C3-7.

## VERDICT: PASS — M1 DoD-COMPLETE.

Redirect map correct and matches E6 exactly; full local deterministic suite (7/7 local gates) GREEN on 4f97179; refutation survived on all five claims; two spot-check anomalies proven to be probe contamination, not code defects. ci-green is DEFERRED to the LAST ACT (tip not yet pushed) — NOT a verdict failure this pass. NO gate artifact written this pass; NO merge. READY FOR LAST ACT once the tip is pushed.

## In plain language

The final piece of M1 — the redirect list that sends every old Wix web address to the right new-site page — is built correctly. 38 redirects, every one a permanent (308) move, every one matching the address list you approved (ESCALATIONS E6) with zero differences: no invented, altered, dropped, or extra mapping. The four store addresses go to your Lightspeed store; the old blog and its 55 posts fold into /press; year archives and the Landscapes gallery go to /collection (as you corrected); policy and social pages go home. Pages the new site already serves under the same name (/murals, /contact, /press, /collection) correctly have NO redirect, so nothing loops or shadows itself. I built and started the real site and watched each redirect fire as a genuine 308 with the right destination; the automated 308 test ran 40 checks that all passed. Every other M1 gate is green on this exact commit. One paperwork note and one cosmetic note are follow-ups, not blockers. The only remaining step is to push this commit and confirm CI goes green on it — my last act.

## Deterministic gate suite — run-gates.sh M1 on 4f97179 (PROBE C3-5)

| gate | lane | result | rc |
|---|---|---|---|
| check | local | PASS | 0 |
| coverage | local | PASS | 0 |
| build-seeded | local | PASS | 0 |
| e2e (INCLUDES redirects.spec.ts) | local | PASS | 0 |
| lighthouse-config | local | PASS | 0 |
| lighthouse (mobile, median-of-3, 12 LHRs) | local | PASS | 0 |
| dep-audit | local | PASS | 0 |
| ci-green | ci | DEFERRED (pass=0) | — |

7 of 7 LOCAL gates GREEN on 4f97179. run-gates.sh overall exit=1 is attributable SOLELY to ci-green, not checkable this pass: origin chuck/M1 = 41b710d (tip not pushed); gh run list --branch chuck/M1 returns non-success. Verified as the LAST ACT after push. NOT a BLOCKED verdict — deferred to post-push by design; confirmed absent-because-unpushed, not red-on-this-commit.

### e2e redirect proof — gate 4/8, rc=0, NOT skipped
54 tests total; redirects.spec.ts contributed 39 redirect tests ALL ok: 31 internal 1:1 (incl /copy-of-2019-6 -> /collection), 4 external -> Lightspeed store, 4 wildcard samples -> /press. playwright --list => Total: 40 tests in 1 file (C3-6). Genuinely collected, non-vacuous, not skipped.

## Redirect map — focused verification

1. Count and shape — CONFIRMED (C3-1): 38 rules, ALL permanent:true (->308), 34 internal (incl wildcards /blog/:path*, /post/:slug*) + 4 external (-> SHOP_URL). No dup, no self-loop, no chain, no identity-shadow, no wildcard over-match.
2. Matches E6 exactly — CONFIRMED (C3-2): 38 vs 38; MISMATCHES 0, MISSING 0, EXTRA 0 -> E6-MATCH EXACT. E6 corrections present: /copy-of-2019-6 -> /collection (not beach-coastal); /social-media -> /; policy -> /; year archives -> /collection; store + /jewelry -> SHOP_URL; /bio -> /story. Identity paths have NO rule.
3. e2e 308 proof RAN and PASSED — CONFIRMED (C3-4): independent runtime probe on clean HEAD build — every sampled source fires literal HTTP/1.1 308 Permanent Redirect with correct Location (internal, E6-correction, home, external -> https://store33134078.company.site/, wildcards). No 307/301/200.
4. No route shadowed / no loop — CONFIRMED (C3-1, C3-4): identity /murals /press /collection return 200 at runtime; no source is a served route; no self-redirect; no chain.
5. Wildcards do not over-match — CONFIRMED (C3-4): /posts /blogs -> 404; real served routes -> 200.
6. Unit-test non-vacuity — CONFIRMED (Bobbi + Ronald-Ann): 6/6 assertion classes bite under mutation; drift guard fires red on divergence; malformed rules fail loudly (tsc TS2322 + next build rejects invalid redirect).

## Delegate wave — five reviewers, all spot-checked, none re-dispatched

- Bobbi (code review): map PASSES; 7/7 claims verified via scripted E6 diff + 5 mutation cycles. 1 important (F-BOBBI-M1-C3-1 missing DECISIONS entry), 2 minor, 1 nit.
- Ronald-Ann (silent-failure): 5/5 claims stand, mutation-proven. e2e genuinely 40 tests; both status(308) and Location assertions non-vacuous; no .skip/.only/.todo; malformed rules fail loudly.
- Lola (SEO): PASS. 38x308-permanent, no chains/loops among map sources, no over-match, no redirect-source/sitemap overlap, 4 external well-formed absolute = SHOP_URL. 1 LOW: trailing-slash 2-hop.
- Steve (security, fired by external-redirect surface): PASS. No open-redirect (wildcards discard captured segment -> constant /press; no user-controlled destination); external = SHOP_URL; no secrets; no new deps; remotePatterns unchanged.
- Snorklewacker (REFUTE, effort max): 5/5 claims SURVIVED via independent build+start runtime probes + mutation test. Load-bearing wrinkle: trailing-slash 2-hop chain. On-disk report file truncated (54 lines, claims 1-2 only) — recorded COULD-NOT-CHECK on the file artifact; full verdict recovered from completion notification; load-bearing claims 1/3/5 reproduced by Binkley C3-4.

### Spot-check outcome (Binkley re-execution)
Load-bearing runtime 308 (C3-4), Bobbi missing-DECISIONS (C3-6), Ronald-Ann e2e non-vacuity (C3-6), Lola/Snork trailing-slash chain (C3-7) — ALL reproduced. No report failed spot-check; none re-dispatched.

### PROBE-CONTAMINATION incident (handled, not a defect)
First runtime probe observed /custom-orders -> /WRONG-SNORK and /shop -> 307. Proven to be Snorklewacker live mutation-test values baked into .next mid-cleanup, NOT a code defect: git diff HEAD -- next.config.ts EMPTY; working blob sha == HEAD blob sha (9e0237e996dc31e1b8a60db1798c86c675716203); no mutation markers in working tree. Re-run after rm -rf .next + clean rebuild (BUILD_RC=0): all 13 samples PASS. Source integrity at consolidation: next.config.ts + test files + constants + src/app byte-identical to HEAD 4f97179; HEAD unchanged.

## FINDINGS

### F-BINK-M1-C3-1 (IMPORTANT -> NEEDS-SENIOR-REVIEW, low functional risk) — missing DECISIONS entry for redirect count
The unit-test comment (redirects.test.ts L66-72) commits to flagging the "37 vs 38" arithmetic discrepancy for DECISIONS (dispatch summary said 33 internal + 4 = 37; the enumerated E6 map yields 34 internal + 4 = 38). No DECISIONS entry exists (last id D23; no D24). The CODE is correct — 34 internal is right per E6; dropping one to reach 37 would 404 a live Wix path. Paper-trail debt only. Recommend a one-line D24 recording 38 (34+4) as the correct E6 count and that "37" was an erroneous dispatch-summary arithmetic. Non-blocking.

### F-BINK-M1-C3-2 (LOW -> NEEDS-SENIOR-REVIEW follow-up) — trailing-slash 2-hop 308 chain
/blog/ and /post/.../ (trailing-slash variants) produce a 2-hop 308->308 chain (e.g. /blog/ -> /blog -> /press) via Next default trailingSlash normalization feeding the rule. Both hops permanent, finite, correct terminus, no link-equity loss. Only trailing-slash variants affected. Follow-up (add explicit trailing-slash rules to collapse to one hop), NOT gate-blocking. Reproduced C3-7 (2 redirects -> 200 /press).

### Minor / nit (Bobbi) — carried as-is
Working-tree hygiene (stray untracked files at repo root) and a Windows .next build-flake note — environment artifacts, not code defects.

## Carry-forward NEEDS-SENIOR-REVIEW flags (all three M1 cycles)

1. a11y zero margin (cycle 2): matthews-turtle and /murals/trail at exactly a11y 0.95 (floor); pre-existing Header/Footer WCAG contrast, NOT M1-introduced; margin thin.
2. /collection mobile perf 0.88 (cycle 2): passes 0.85 budget on mobile median-of-3 but thinnest route.
3. server-start races un-retried (cycle 2): removed whole-autorun retry left server-start races un-retried; narrow, environment condition, never a claimed guarantee.
4. redirect DECISIONS entry missing (cycle 3, F-BINK-M1-C3-1): documentation-trail debt; code correct.
5. trailing-slash 2-hop chain (cycle 3, F-BINK-M1-C3-2): benign, permanent, no equity loss.

## Cross-cycle M1 DoD status (BUILD-SPEC M1 items 1-4)
- Item 1 (sitemap/robots/unique metadata): PASS (cycle 1).
- Item 2 (analytics): PASS (cycle 1).
- Item 3 (Wix->new-site redirect map): PASS (cycle 3, this report) — matches E6 exactly, 38x308, e2e-proven.
- Item 4 (Lighthouse budgets, mobile): PASS (cycle 1 baseline + cycle 2 mobile+median remediation).

## COVERAGE MANIFEST
Rule zero: "Unexecuted = hypothesis." — anything assertable by running a command is run (output quoted) or labeled UNVERIFIED.

### CHECKED
- Deterministic gate suite on 4f97179: run-gates.sh -> 7/7 local gates PASS (M1-results.json, M1.log). [C3-5]
- e2e ran redirect spec, 39 tests ok, rc=0; playwright --list = 40 tests. [C3-6]
- Redirect map shape: 38 rules, all permanent, 34 int + 4 ext, no dup/loop/chain/shadow/over-match. [C3-1]
- E6 exact match: 0 mismatch / 0 missing / 0 extra; identity paths have no rule. [C3-2]
- Runtime 308s fire with correct Location on clean HEAD build; identity paths 200; siblings 404. [C3-4]
- Trailing-slash 2-hop chain characterized. [C3-7]
- Missing DECISIONS entry for redirect count (last id D23). [C3-6]
- Source integrity: source files + src/app byte-identical to HEAD; HEAD unchanged. [consolidation]
- Security (Steve): no open-redirect, external = SHOP_URL, no secrets, no new deps.
- Unit/e2e non-vacuity (Bobbi + Ronald-Ann): mutation-proven; drift guard fires; malformed rules fail loudly.

### NOT CHECKED (reason — debt, not a pass)
- ci-green on 4f97179: tip not yet pushed (origin chuck/M1 = 41b710d). DEFERRED to the LAST ACT by design; verified after push. A scheduled step, not a skipped one.
- Vercel-edge redirect parity: local next start only; Vercel preview parity is an M4/cutover concern, not gated here.
- All 34 internal sources individually at runtime beyond the sampled set: e2e covers 39 and the runtime probe sampled a representative cross-section; the full enumerate-every-source runtime sweep NOT run (sampled, per spot-check doctrine).
- Apex/www host canonicalization: explicitly deferred to M4 per E6 (DNS/Vercel-domain step), not part of this path map.

### COULD NOT CHECK (exact failure)
- Snorklewacker on-disk report file truncated to 54 lines (claims 1-2 only; missing claims 3-5 and coverage manifest). Full verdict recovered from the completion-notification return; load-bearing claims reproduced (C3-4, C3-7); coverage filled, gap recorded.
- Clean first-attempt next build non-deterministic on win32 during concurrent delegate probing (recurring ENOENT build-manifest.json / pages-manifest.json; torn .next cache); every gate/probe succeeded on a clean-tree rebuild (build-seeded gate rc=0; Binkley rebuild BUILD_RC=0). Environment flake, not a code defect.

---
Consolidated by Binkley (chuck:binkley), M1 completion gate cycle 3. READY FOR LAST ACT (verify ci-green on the pushed tip + re-run gates once + write-gate.sh pinned to that tip) once the orchestrator close pushes 4f97179.

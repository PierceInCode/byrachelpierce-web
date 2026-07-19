# Bobbi — M1 code review (cycle 1)

**Rule zero, verbatim: "Unexecuted = hypothesis."** Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED. Every finding below pins to the run recorded in `.chuck/probes/M1-ledger.md`.

## PINS
- Repo: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
- HEAD under gate: 87e5c2820593cce7173bac99dd60fbf69d17f6d3 (verified via git rev-parse HEAD)
- Base (merge-base): 41b710d2c748471d832bba5a36e14c42c1b14518
- Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7
- Lane: owner-verifier — grade the M1 code diff vs BUILD-SPEC M1 (correctness / contracts / failure paths / standards)

## VERDICT: PASS (with one IMPORTANT config divergence for Oliver + NEEDS-SENIOR-REVIEW notes)

All six focus items verified by executed probes. The SEO code (sitemap, robots, metadata-uniqueness, analytics) is correct and its tests are non-vacuous. Iron rule 7 is honored exactly. The one substantive defect is a delivered artifact: lighthouserc.json asserts the DESKTOP profile where spec AND architecture both require MOBILE. It does not block M1 own DoD gate (npm run check + SEO tests) but is wrong as landed and will mis-gate at R5 go-live if not corrected.

---

## FOCUS-ITEM FINDINGS (each proven or labeled UNVERIFIED)

### Item 1 — sitemap.ts enumerates exactly 20 fixture painting URLs + static + category, slugs read live from DB — VERIFIED, confidence high
Probe P1 (tests/seo/sitemap.test.ts, verbose): all 5 sitemap tests PASS, including "enumerates exactly the 20 fixture painting pages, shaped /collection/painting/<slug>" and "produces no duplicate URLs". Source (src/app/sitemap.ts) builds painting entries from await getAllPaintingSlugs() (line 34, 44-46) — DB-sourced, NOT hardcoded; shape ${BASE}/collection/painting/${slug} is correct. Static = 10 paths (line 20-31); categories = COLLECTION_CATEGORIES (9, verified in constants.ts) mapped to /collection/<slug>. Fixture has exactly 20 paintings, 0 duplicate slugs, all satisfy [a-z0-9._-]+ (P5). The trail status/checkin API routes are correctly ABSENT from the sitemap.

### Item 2 — robots.ts disallows trail status/checkin API + advertises sitemap — VERIFIED, confidence high
Probe P1 (tests/seo/robots.test.ts): all 3 tests PASS. Source (src/app/robots.ts line 18) disallow: ['/api/trail/status', '/api/trail/checkin']; sitemap advertised as https://byrachelpierce.com/sitemap.xml (line 20); allow: '/'. e2e (tests/e2e/seo.spec.ts) additionally asserts the rendered /robots.txt string contains both Disallow lines — Binkley gate 4/8 recorded e2e PASS.

### Item 3 — metadata-uniqueness assertion is NON-VACUOUS — PROVEN, confidence high
Probe P2. Method: an UNTRACKED scratch test importing the SAME real page modules the tracked test uses, resolving the SAME 39 pages (10 static export metadata; 9 category + 20 painting via generateMetadata against real fixture slugs). All 4 scratch assertions PASS: (a) exactly 39 real pages resolve; (b) the PRISTINE real set has zero duplicate titles/descriptions; (c) an INJECTED duplicate title IS caught by the identical dedup logic; (d) an INJECTED duplicate description IS caught. Therefore the tracked test resolves real pages and WOULD FAIL on a real duplicate. No tracked file modified; scratch file deleted; git status --short tests/seo/ clean afterward.

NEEDS-SENIOR-REVIEW (design note, not a defect): the tracked test compares BASE title strings, not the fully-rendered "%s | by Rachel Pierce" title. Its own comment argues (correctly) that a common template suffix means unique base titles imply unique rendered titles. This holds for the current page set (all dynamic routes set plain-string titles; statics set base strings). Flagged only so Binkley notes the assertion is on base strings by design, not rendered output.

### Item 4 — Iron rule 7: ONLY @vercel/analytics + @lhci/cli added — VERIFIED, confidence high
Probe P3 over BOTH the package.json diff AND the package-lock.json root manifest (packages empty-key entry):
- ROOT dependencies ADDED: @vercel/analytics@^2.0.1 (only); devDependencies ADDED: @lhci/cli@^0.15.1 (only); optional/peer: none added; none removed/changed.
- 198 new top-level node_modules entries are ALL transitive of @lhci/cli (sentry / puppeteer / chrome-launcher / express, etc.). Iron rule 7 governs DIRECT/sanctioned deps; no unsanctioned direct dep was introduced. DECISIONS D23 records @lhci/cli as sanctioned. CLEAN.

### Item 5 — @vercel/analytics wired in root layout correctly — VERIFIED, confidence high
src/app/layout.tsx line 10 import { Analytics } from '@vercel/analytics/next', rendered at line 110 inside <body>. Probe P1 (layout-analytics.test.tsx) renders the real layout (fonts/Header/Footer stubbed, analytics stubbed with a sentinel) and asserts the sentinel present — PASS. Probe P8 confirms the REAL package @vercel/analytics@2.0.1 genuinely exposes the ./next subpath (import => ./dist/next/index.mjs), and typecheck (P4) passes, so the real import resolves — not merely the vitest mock.

### Item 6 — getAllPaintingSlugs(): query / ordering / draft-filter — VERIFIED, confidence high
src/lib/art-service.ts lines 192-198: select({ slug }).from(paintings).orderBy(asc(paintings.slug)), returns rows.map(r => r.slug). There is no draft/published column in the schema (doc comment lines 186-191 states this; art-service has no published/draft predicate anywhere) — so returning all rows is correct, every row is a live public page. Ordering is asc(slug). Covered by the art-service coverage gate (Binkley: coverage PASS, Lines 90.45%). Consequence worth noting (not a defect): the FIRST painting entry in the sitemap is a-colorful-crowd_product (alpha-first), NOT matthews-turtle; the sitemap test only .toContain-checks matthews-turtle presence, so this is fine.

---

## ADDITIONAL FINDINGS (coverage-first; report everything)

### F-BOBBI-M1-1 — lighthouserc.json asserts DESKTOP where spec requires MOBILE — IMPORTANT, confidence high
Probe P7. lighthouserc.json line 13-15: settings.preset = "desktop". BUT:
- BUILD-SPEC section 10.2 (line 337): "Perf >=85 mobile, A11y >=95, SEO >=95".
- Architecture section 11 (line 254): "Performance >= 85 mobile, Accessibility >= 95, SEO >= 95".
- Architecture section 1.1 (line 22): "The audience is on a phone."
The mobile Lighthouse profile applies materially stricter CPU/network throttling than desktop; a run passing the desktop budget does NOT prove the mobile budget the spec names. The delivered artifact gates the wrong profile. It does not block M1 own DoD (M1 gate = npm run check + SEO tests), and Binkley gate run recorded the lighthouse gate as PASS — but PASS against DESKTOP, so that green does not attest the spec mobile contract. Oliver remediation: use the mobile profile (remove preset: desktop — LHCI default is the mobile/slow-4G profile — or set mobile emulation) and re-run. NEEDS-SENIOR-REVIEW: whether to hold M1 for this or defer to R5 (the lighthouse gate is nominally an R5 go-live gate) is Binkley call.

### F-BOBBI-M1-2 — run-lighthouse.mjs retries autorun once on non-zero exit — MINOR, confidence medium, NEEDS-SENIOR-REVIEW
scripts/run-lighthouse.mjs lines 84-97 retry the whole lhci autorun once on non-zero exit. The comment argues deterministic budget misses fail both attempts so real misses are not masked. Mostly true, but a perf score sitting on the 0.85 boundary is NOT deterministic (Lighthouse perf is noisy, esp. with numberOfRuns 1), so a retry CAN flip a genuine near-threshold regression to green. Combined with F-BOBBI-M1-1 the perf gate is doubly soft (desktop profile + single run + retry). Flag for Binkley; remediation optional (raise numberOfRuns, or scope the retry to launcher EPERM only).

### F-BOBBI-M1-3 — numberOfRuns: 1 — MINOR, confidence medium
lighthouserc.json line 4. A single Lighthouse run makes perf scoring noisy near the threshold. Not a spec violation (spec does not mandate a run count) — reported for coverage.

### F-BOBBI-M1-4 — BUILD-SPEC M1 item-3 (Wix redirects) absent in diff — CODE FACT ONLY, disposition = Binkley
Probe P6: next.config.ts has NO redirects() (only images.remotePatterns + reactStrictMode); no redirect/308 e2e test exists (grep -rln redirect|308 tests/e2e/ => no match). Per Bobbi brief, the session records item-3 as a deliberately-batched operator/human-hands item; whether that is an acceptable DoD gap is Binkley call, not mine. I report only that the code + test are absent.

### F-BOBBI-M1-5 — @vercel/analytics pulls a next version flagged MODERATE (postcss XSS chain) — NIT, confidence medium
Recorded from Binkley dep-audit (M1-ledger gate 7/8): 4 MODERATE vulns, ZERO high/critical, gate --audit-level=high passes. Iron rule 7 is about sanctioned deps, not CVEs; noting for awareness only.

---

## STANDARDS / CONTRACT NOTES (no defect)
- npm run check (P4): eslint clean, prettier clean, tsc --noEmit clean, 198/198 vitest pass. Style and typing discipline met across the diff.
- Failure-path posture on the SEO surfaces is sound: sitemap enumerates crawlable content only and cannot leak the disallowed API routes (they are not in STATIC_PATHS/categories/slugs); robots fails safe (disallow list is explicit). No untrusted input reaches these builders.
- DECISIONS D23 correctly records @lhci/cli sanction + the Chrome-via-Playwright mechanism (no new dep).

---

## COVERAGE MANIFEST

**Rule zero, verbatim: "Unexecuted = hypothesis."** — anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

### CHECKED (probe + output recorded in M1-ledger.md)
- Focus 1 sitemap 20-URL enumeration + static + category + DB-sourced slugs — P1 (vitest 5/5 PASS), P5 (fixture 20 / 0-dup / regex), source read.
- Focus 2 robots disallow + sitemap advertise — P1 (vitest 3/3 PASS), source read; e2e string-level via Binkley gate 4/8.
- Focus 3 metadata-uniqueness non-vacuity — P2 (scratch inject: 39 pages resolve, pristine clean, injected dup title+desc BOTH caught, 4/4 PASS; scratch deleted, tree clean).
- Focus 4 Iron rule 7 direct-dep freeze — P3 (lockfile root-manifest diff: only @vercel/analytics + @lhci/cli; package.json diff concurs).
- Focus 5 Analytics wiring — P1 (layout render test PASS) + P8 (real ./next export exists) + P4 (typecheck resolves real import).
- Focus 6 getAllPaintingSlugs query/order/no-draft-filter — source read + P4 coverage; schema has no published/draft column.
- Full gate npm run check — P4 (lint/format/typecheck clean, 198/198 tests).
- Lighthouse config vs spec — P7 (preset desktop vs spec+arch "mobile", grep-confirmed both docs).
- item-3 redirect code facts — P6 (no redirects() in next.config.ts, no redirect e2e).

### NOT CHECKED (and why)
- npm run e2e (playwright seo.spec + full suite) — NOT re-run by Bobbi; needs a built+seeded server. Relied on Binkley gate 4/8 PASS. The e2e string-level robots/sitemap assertions therefore rest on Binkley run, not mine.
- npm run lighthouse full audit — NOT re-run by Bobbi (needs build + Chrome). Relied on Binkley gate 5-6/8. F-BOBBI-M1-1 is a STATIC config-vs-spec finding, independent of running it.
- npm run build SSG page count (20 painting SSG) — NOT re-run; Binkley gate 3/8 PASS (36 static pages incl 20 painting).
- OG-tag spec-item (OG spot-checks, 10.1.1) — NOT independently audited beyond reading layout.tsx openGraph block; no per-page OG uniqueness test exists in the diff. Reported as an observation, not graded.
- scripts/lighthouse-teardown-shim.mjs internals — read for purpose (win32 EPERM teardown made non-fatal) but not exercised in isolation.
- tests/probes/mural-content.probe.test.ts — RAN (P1 batch, 3/3 PASS) but it is an M2-staged probe, outside M1 focus; noted, not graded against the M1 contract.
- Binkley lighthouse 0.99-assertion anomaly (M1-ledger lines 44-63) — NOT investigated by Bobbi; it is Binkley open item and orthogonal to the desktop/mobile finding.

### COULD NOT CHECK (command tried, failed — paste)
- (none) — every probe Bobbi attempted executed successfully. No command failed.

---

## TREE-STATE NOTE (not an M1 defect — hygiene flag for Binkley)

### F-BOBBI-M1-6 — stray UNTRACKED test file in working tree — NEEDS-SENIOR-REVIEW, confidence high
`tests/seo/_probe_meta_coverage.test.ts` exists in the working tree (mtime within this wave window) but is UNTRACKED (git ls-files --error-unmatch fails) and is NOT part of the M1 diff (git diff --name-only 41b710d..87e5c28 -- tests/seo/ lists only the 4 known SEO test files). It is NOT a Bobbi artifact — Bobbi's only scratch file (_scratch_nonvacuity.test.ts) was deleted and is confirmed gone. It appears to be a stray from a concurrent wave agent. Consequence: because vitest default glob matches tests/**/*.test.ts, any `npm run test`/`npm run check` run on THIS working tree (including Bobbi P4, which reported 198 tests) may include this file's 1 `it()` block in the aggregate count. This does NOT affect any per-focus-item verdict here — each item was proven by a targeted probe against TRACKED files, not the aggregate. Bobbi did not delete it (not Bobbi's to remove). Binkley should clean the working tree before the ci-green gate so the committed HEAD is what is measured.

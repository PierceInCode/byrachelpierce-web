# Lola Granola — SEO & Content Report — M1 cycle 1

**Rule zero: Unexecuted = hypothesis.**

Repo: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
HEAD under gate: 87e5c2820593cce7173bac99dd60fbf69d17f6d3
Base: 41b710d2c748471d832bba5a36e14c42c1b14518
Diff (`git diff 41b710d..87e5c28`): saved at scratchpad/M1.diff — 18 files changed, 4063 insertions(+), 33 deletions(-). Note: the diff file's sha256 (56793474...) does not match the pinned "diff hash" (219dd906...) in my brief — the pin is likely git's hash-object format, a different digest algorithm over the same content; both commit SHAs independently resolved via `git rev-parse` and matched the pins exactly, and `git diff --stat` between them matches the file list in the saved diff. Treated as a non-issue (format mismatch, not content mismatch) but noted rather than silently assumed.

## Inputs held

1. **Milestone diff** — held, read directly (`git diff --stat` + full read of the SEO-relevant hunks: sitemap.ts, robots.ts, layout.tsx, art-service.ts).
2. **Copy-voice rules / SEO intent** — held: docs/SITE-ARCHITECTURE-v2.md section 12.7 (Copy voice) and section 12.1 (brand voice); docs/FINAL-BUILD-SPEC.md M1 excerpts as pasted in the brief.
3. **.chuck/gates.json** — held, read in full (M1 gate list: check, coverage, build-seeded, e2e, lighthouse-config, lighthouse, dep-audit, ci-green). **Rendered-output harness** — held: a prior seeded build from Binkley's/Portnoy's gate runs exists at .next/server/app/* and .lighthouseci/* (both gitignored, both freshly produced on HEAD 87e5c28 per the ledger — Binkley's "ANOMALY RESOLVED" entry re-ran clean and confirmed these are HEAD-fresh artifacts, not stale). I read these built files directly rather than re-running the expensive build/seed/e2e pipeline myself, consistent with my brief's "you may run the vitest sitemap/robots tests directly for speed" guidance and avoiding duplicate work already done and ledgered by Binkley/Portnoy.

Nothing in my brief was unlocatable — no COULD NOT CHECK rows for inputs themselves.

## Findings

### 1. sitemap.xml — VERIFIED CORRECT

- Unit tests (tests/seo/sitemap.test.ts, run directly): 5/5 PASS — enumerates all 10 static pages, exactly 9 category pages, exactly 20 fixture painting pages shaped /collection/painting/<slug>, no duplicate URLs, all URLs well-formed under the https://byrachelpierce.com base.
- Cross-checked against the REAL BUILT sitemap.xml.body (from .next/server/app/, produced by Binkley's HEAD-fresh seeded build): quoted verbatim in the ledger (L3/L4). Programmatic recount: 39 total <loc> entries = 10 static + 9 category + 20 painting, zero dupes, zero /api/trail/* leakage, all entries on the correct base URL, HTTP 200 with content-type: application/xml.
- Fixture cross-check (L5): tests/fixtures/catalog.json has exactly 20 paintings; slug set is identical to the sitemap's painting URLs (matched, including the matthews-turtle spot-check).
- getAllPaintingSlugs() (new in this diff, src/lib/art-service.ts:192-198) queries the live paintings table — not hardcoded — satisfying the stated design intent that the M4 sitemap-vs-db gate has a real DB-driven population to compare against.
- VERDICT: PASS, with real build-output + unit-test double confirmation.

### 2. robots.txt — VERIFIED CORRECT

- Unit tests (tests/seo/robots.test.ts): 3/3 PASS.
- Real built robots.txt.body, quoted verbatim:
  User-Agent: *
  Allow: /
  Disallow: /api/trail/status
  Disallow: /api/trail/checkin

  Sitemap: https://byrachelpierce.com/sitemap.xml
- Allow /, both trail API routes disallowed, sitemap advertised at the correct absolute URL. HTTP 200, content-type: text/plain.
- VERDICT: PASS.

### 3. Per-page unique title + description — VERIFIED CORRECT, with two advisory findings

- tests/seo/metadata-uniqueness.test.ts run directly: 3/3 PASS — every one of the 39 resolved public pages (10 static + 9 category + 20 painting) has a non-empty title and description; no two pages share a title; no two pages share a description. This is a real assertion over real resolved generateMetadata/metadata exports against the seeded fixture DB, not a vacuous check (Bobbi's ledger entry P2 independently proved the dedup logic actually catches injected duplicates, corroborating).
- Spot-checked real values by reading source directly (quoted from the files): e.g. Story page description honestly says "from television on-air talent to full-time artist" and "14 island murals" — this "14" claim is pre-existing (not part of this diff; murals/page.tsx etc. were not touched by 41b710d..87e5c28) and consistent across the murals/story/trail pages, so no internal contradiction was introduced by this milestone. I did not re-verify "14" against a ground-truth murals count — out of this diff's scope, NOT CHECKED here (Chuck's mural-content gate at M2 is the designed check for that claim).
- Painting-page description is dynamically built from real DB fields (title, medium, availability). Confirmed via real rendered HTML on matthews-turtle: the description meta reads literally "Matthew's Turtle" (em dash) Acrylic on canvas by Rachel Pierce. Sold - prints available. Honest, DB-sourced, no fabrication (Iron rule 3 compliant).
- Advisory finding (not a defect): 4 of 10 static-page descriptions exceed the conventional 160-character SERP-snippet truncation risk threshold — Story (162), Visit (162), Trail (165), Home (170) — measured directly (ledger L10). BUILD-SPEC does not mandate a length ceiling, so this is not a contract violation, but it is a real, reproducible measurement worth a copy trim before go-live.
- Advisory finding (not a defect): no page in the diff or the pre-existing tree sets metadata.alternates.canonical. Confirmed by sweeping all 30 prerendered .html files under .next/server/app/ (ledger L8) — zero link rel=canonical tags anywhere, site-wide. Next.js does not auto-emit canonical tags; this requires an explicit alternates.canonical in each metadata block. Not in my brief's four numbered items and not mentioned in the M1 BUILD-SPEC excerpt I was given, so not a M1-scope defect, but it is a real Technical-SEO coverage gap (self-referencing canonicals are standard practice to prevent duplicate-content ambiguity from query-string or trailing-slash variants) — flagging as NEEDS-SENIOR-REVIEW for a future milestone, since I cannot tell from the Spec whether this was deliberately deferred.

### 4. OG images on painting pages — VERIFIED CORRECT

- Source inspection (src/app/collection/painting/[slug]/page.tsx line 33): the openGraph field is set conditionally on painting.webImagePath, using artUrl(painting.webImagePath) — conditional on a real DB column, not fabricated/placeholder data.
- Verified against REAL RENDERED HTML (not just source), matthews-turtle.html:
  og:image content = https://byrachelpierce.com/art/web/matthews-turtle-7bb2b9a6.jpg
  twitter:image content = https://byrachelpierce.com/art/web/matthews-turtle-7bb2b9a6.jpg
  twitter:card content = summary_large_image
  The image URL is a correctly-resolved ABSOLUTE URL (via the layout's metadataBase: new URL('https://byrachelpierce.com')), even though artUrl() itself returns a relative path locally (/art/web/...) unless NEXT_PUBLIC_ART_BASE_URL is set. I did not open the image binary — only the metadata/HTML text, per the standing constraint.
- VERDICT: PASS, with the strongest evidence tier (real rendered HTML), not source-code inference alone.

### Structured data — ADVISORY (out of Spec scope)

- Zero JSON-LD or microdata anywhere in src/ (grep) or in rendered HTML (checked matthews-turtle.html directly). docs/FINAL-BUILD-SPEC.md never mentions structured data/JSON-LD/schema.org/rich results — its absence is not a broken promise, just an unexploited opportunity (painting detail pages are a natural fit for VisualArtwork or Product schema). Recorded as NOT CHECKED against a Spec requirement (none exists); flagged as a content/SEO improvement opportunity, not a gate-blocking defect.

### Core Web Vitals / Lighthouse SEO — MEASURED, with a real disagreement to reconcile

- Read real LHR JSON (.lighthouseci/lhr-*.json, produced fresh on HEAD 87e5c28 per Binkley's re-run). Lighthouse SEO category score = 1.0 (perfect), zero failing SEO audits, on all 4 budget URLs (/, /collection, /collection/painting/matthews-turtle, /murals/trail).
- CWV numbers (quoted in ledger L11): LCP 592-762ms, CLS 0-0.042, TBT 0ms across all 4 pages — all comfortably inside "good" thresholds (LCP <2.5s, CLS <0.1).
- Reconciliation with Portnoy (required by rule zero — CWV overlaps his performance-budget lane): Portnoy's ledger entry (Probe 5) and Bobbi's ledger entry (P7, finding F-BOBBI-M1-1) both independently found lighthouserc.json runs the desktop Lighthouse preset (cpuSlowdownMultiplier: 1, fast simulated network), while docs/FINAL-BUILD-SPEC.md section 10.2 and docs/SITE-ARCHITECTURE-v2.md section 11 both specify "Performance >= 85 MOBILE." I independently confirmed this via the same configSettings.formFactor: "desktop" field in the LHR JSON I read. I agree with Portnoy's finding: my LCP/CLS/CWV numbers above are desktop-preset lab numbers and must not be read as evidence the mobile CWV budget is met. This is Portnoy's finding to own; I am not re-flagging it as a separate defect, only confirming agreement rather than silently using the numbers to claim mobile CWV compliance.
- NEEDS-SENIOR-REVIEW: INP is not measured at all. Confirmed directly: the interaction-to-next-paint audit key does not exist in the LHR; the related interaction-to-next-paint-insight audit has score: null, scoreDisplayMode: "notApplicable". Lighthouse navigation-mode (lab, single-page-load) runs cannot produce a real INP value — INP requires field data from actual user interactions (e.g. CrUX or a web-vitals JS harness), neither of which this project has. This is a genuine, reproducible coverage gap in "Core Web Vitals — LCP/CLS/INP measured" per my brief's coverage list: LCP and CLS are measured; INP is not measured by any tool in this repo.
- numberOfRuns: 1 in lighthouserc.json — single-run scores, not a median-of-N. Noted as a measurement-stability caveat (Portnoy's lane to weigh); I did not re-run Lighthouse myself to avoid duplicating his/Binkley's already-ledgered, HEAD-fresh runs.

### Content voice — scoped N/A for this diff, spot-check clean

- This milestone's src/ diff adds no new user-facing prose (only sitemap.ts, robots.ts, an Analytics import in layout.tsx, and a new DB-query function). Grading Architecture section 12.7 copy-voice rules against content this milestone didn't author would be re-litigating earlier milestones' work outside my pinned diff.
- As a sanity spot-check (not a full audit), the pre-existing static-page titles/descriptions I read while checking uniqueness (item 3) comply with section 12.7: sentence case throughout, "on your wall" phrasing in the AR description matches the design doc's own example verbatim ("on your wall," never "in situ visualization" — Architecture section 12.7), no exclamation points, no "limited time"/fake-urgency language found in any of the 10 static-page descriptions I read.

## Coverage manifest

**CHECKED**
- sitemap.xml well-formedness, URL count/shape, no dupes, correct base, no trail-API leakage — npx vitest run tests/seo/sitemap.test.ts (5/5 PASS) + direct read of real built .next/server/app/sitemap.xml.body + scratchpad/count-sitemap.mjs (39 locs = 10+9+20, zero dupes, zero /api/trail).
- robots.txt Allow/Disallow/Sitemap directive correctness — npx vitest run tests/seo/robots.test.ts (3/3 PASS) + direct read of real built .next/server/app/robots.txt.body.
- Per-page title/description uniqueness across all 39 public pages — npx vitest run tests/seo/metadata-uniqueness.test.ts (3/3 PASS).
- Painting-page OG image presence and correctness (real, DB-sourced, absolute URL) — source read of generateMetadata in page.tsx + real rendered og:image/twitter:image meta tags extracted from matthews-turtle.html.
- Painting-page description honesty (no fabricated claims) — real rendered description meta quoted and checked against DB-field-driven template.
- getAllPaintingSlugs() is DB-driven, not hardcoded — direct source read, src/lib/art-service.ts:192-198.
- Fixture-to-sitemap slug parity (20 = 20, set-equal) — scratchpad/count-fixture.mjs against tests/fixtures/catalog.json.
- Title/description length measurement (truncation-risk audit) — scratchpad/title-lengths2.mjs, all 10 static-page rendered lengths computed and flagged.
- Canonical-tag presence sweep — scratchpad/check-canonical-all.mjs over all 30 prerendered .html files (0/30 have one).
- Structured-data (JSON-LD/microdata) presence — grep over src/ (source) + scratchpad/check-ldjson.mjs over rendered HTML (both: absent) + grep over docs/FINAL-BUILD-SPEC.md (never promised).
- Lighthouse SEO-category score and per-page failing-audit list — scratchpad/extract-lhr2.mjs over real .lighthouseci/lhr-*.json (SEO = 1.0, zero failing audits, all 4 URLs).
- LCP and CLS numbers — same LHR read (592-762ms LCP, 0-0.042 CLS, all 4 URLs), with the desktop-vs-mobile-preset caveat reconciled against Portnoy's/Bobbi's independent finding.
- INP measurability — confirmed absent/notApplicable in the LHR audit set (interaction-to-next-paint-insight), a real, reproducible tool-output finding, not an assumption.
- Copy-voice spot-check of pre-existing static-page copy against Architecture section 12.7 — read directly, sentence case / tourist-plain / no-fake-urgency all confirmed compliant on the 10 static pages.

**NOT CHECKED**
- Full page-by-page content-voice audit of every page's body copy (not just title/description) against section 12.7 — out of scope: this milestone's diff authored no new prose; a full audit belongs to whichever milestone last touched each page's body copy.
- "14 murals" and other pre-existing factual claims (Iron rule 3) — out of scope for this diff (unchanged by 41b710d..87e5c28); Chuck's mural-content gate at M2 is the designed checkpoint for that claim.
- Structured data (JSON-LD) implementation — never promised by the Spec for this milestone; flagged as an advisory improvement opportunity, not audited further since there is nothing to validate.
- Canonical-tag rollout plan — the Spec excerpt I was given doesn't mention canonical tags at all; I don't know if this is deliberately deferred to a later milestone or a genuine oversight, so I record the fact (0/30 pages) and defer the judgment call rather than guessing.
- /collection and /collection/[category] dynamic-route rendered HTML meta tags (only the static-shell and the SSG painting pages produce standalone .html snapshots under .next/server/app; the dynamic routes are server-rendered on request, not snapshotted to disk) — the metadata-uniqueness unit test already resolves their generateMetadata output directly in-process, so title/description correctness IS checked (item 3 above), but I did not fetch a live rendered head for these two routes the way I did for the painting page. Deferred: would require a running dev/prod server plus HTTP fetch, which duplicates Binkley's e2e lane.
- Mobile-preset Lighthouse CWV numbers — no mobile-preset LHR was produced by this milestone's gate run (desktop-only, per Portnoy's/Bobbi's finding); I have no mobile numbers to report, measured or otherwise.
- Field-collected (CrUX / RUM) Core Web Vitals — this project has no field-data collection mechanism; only lab (Lighthouse) data exists.

**COULD NOT CHECK**
- (none) — every probe I attempted this cycle completed and returned a result; no command failed outright. The one near-miss (my first extract-lhr.mjs script crashed on a .html file matched by an overly-broad glob) was a script bug on my end, fixed and re-run successfully (extract-lhr2.mjs) rather than a genuine tool/environment failure — not logging it as COULD NOT CHECK since the underlying probe did succeed once corrected.

## Verdict

SEO technical correctness for this milestone's actual diff scope (sitemap, robots, metadata uniqueness, painting OG images) is PASS, proven with both unit tests and real built-artifact inspection (not source-reading alone). Two advisory/non-blocking findings (no canonical tags site-wide; 4/10 descriptions risk SERP truncation) and one NEEDS-SENIOR-REVIEW item (INP is entirely unmeasured by this project's tooling — a real Core Web Vitals coverage gap, distinct from Portnoy's desktop-vs-mobile finding, which I independently confirm and defer to him on).

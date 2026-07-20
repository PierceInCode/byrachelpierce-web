# Lola Granola -- M1 cycle 3 -- Wix-to-new-site redirect map SEO review

Rule zero: Unexecuted = hypothesis.

Scope: 4f97179 (base 41b710d) -- next.config.ts redirectRules/redirects(), tests/e2e/redirects.spec.ts, tests/seo/redirects.test.ts. Sitemap/robots/metadata/CWV are OUT of my lane (PASSED cycle-1, ledger).

---

## Claim-by-claim findings

### 1. Every rule permanent:true -> 308; none temporary
VERIFIED. Static extraction from next.config.ts (independent regex parse, not hand-copied): 38/38 rules have permanent: true, 0 non-permanent. Confirmed live: dev server run against all 38 sources returned status=308 for every one. Confirmed again via production build: npx playwright test tests/e2e/redirects.spec.ts -> 40/40 passed (34 internal/wildcard + 4 external + 2 wildcard-sample assertions), each asserting response status equals 308.

308 vs 301 judgment: 308 preserves the request method (relevant for non-GET, not exercised by crawlers) and is functionally equivalent to 301 for link-equity transfer on GET, which is what matters for organic-search PageRank consolidation. This is the correct permanent-move signal and matches E6's explicit all-redirects-are-308-permanent operator answer. No 307/302 found anywhere in the map.

Probe output:
    Extracted 38 rules from next.config.ts
    [Claim 1] non-permanent rules: 0

### 2. No redirect CHAIN (destination is never itself a source)
VERIFIED -- with one caveat surfaced (Finding L1 below). Static walk: 0 of 38 destinations match any of the 38 sources (chainHits: 0). Live confirmation: fetched every one of the 12 distinct internal destination paths (/custom, /story, /visit, /, /collection, /collection/watercolors, /collection/abstracts, /collection/beach-coastal, /collection/birds-wildlife, /collection/florals, /collection/mermaids-whimsy, /collection/palm-trees, /collection/sea-life, /collection/line-art, /press) -- every one returned a non-redirect status code (200 or a transient app-layer 500, see Environment Note; neither is 301/302/307/308), confirming none is itself a redirect source.

Finding L1 (LOW, informational): trailing-slash variants of the two wildcard sources produce a genuine 2-hop chain, not from the redirect map itself but from Next.js's own trailing-slash normalization interacting with it:

    trace from /post/:
    hop0: /post/  -> 308 -> /post
    hop1: /post   -> 308 -> /press
    hop2: /press  -> 200 (terminal)

    trace from /blog/:
    hop0: /blog/  -> 308 -> /blog
    hop1: /blog   -> 308 -> /press
    hop2: /press  -> 200 (terminal)

    trace from /post/some-post/:
    hop0: /post/some-post/ -> 308 -> /post/some-post
    hop1: /post/some-post  -> 308 -> /press
    hop2: /press -> 200 (terminal)

Both hops are 308 (permanent), so link equity is not lost, and this is NOT a loop (each hop is terminal in 3 or fewer hops, confirmed no revisit). But it is a genuine 2-hop chain for any inbound backlink or old sitemap entry that included a trailing slash on a Wix blog/post URL -- worth a follow-up (Next's trailingSlash config, or an explicit rule for the trailing-slash variant) but not a blocker; severity LOW because search engines follow 308 chains and consolidate signal, just less efficiently than 1 hop. Flagging per under-flagging-is-the-failure-mode.

### 3. No redirect LOOP (self or transitive)
VERIFIED. 0 direct self-loops (source equals destination, checked all 38). Since chain hits = 0 (excluding the Next-native trailing-slash hop in L1, which is bounded and terminal, not cyclical -- explicitly traced with a revisit-detector that found no repeated path), no transitive loop exists. Loop-detection trace script re-confirmed 0 cycle-detected / self-loop-detected flags across 6 traced paths including the two wildcard edge cases.

### 4. Wildcards blog-path-wildcard and post-slug-wildcard do not over-match a served route
VERIFIED. Static check: no served route (/, /collection, /murals, /murals/trail, /ar, /contact, /custom, /press, /story, /visit, /collection/painting/<slug>, /collection/<category>) begins with /blog or /post -- 0 collisions. Live confirmation: /press, /collection, /murals, /contact all served their own page with no redirect (200/500-app-error, never 308). Playwright e2e wildcard-sample assertions (/post/some-post, /post/deeply/nested/slug, /blog/categories/in-the-news, /blog/2019/some-old-post) all 308 to /press, none collided with a served path. /blog and /post are confirmed Wix-only prefixes with no served new-site equivalent under those names.

One nuance worth recording (not a defect): the wildcard tokens are zero-or-more per Next's path-to-regexp, so bare /post (no slash, no slug) and bare /blog (already an explicit literal rule ordered first) both resolve -- live-tested /post to 308 to /press, consistent with E6's blanket-to-press instruction for the 55-post class and not an over-match onto any served route.

### 5. No served route is shadowed by a redirect
VERIFIED. Static: 0 of the 4 named identity paths (/murals, /contact, /press, /collection) appear as a rule source; extended the check to all 10 static served routes -- 0 shadows found. Live: fetched /murals (200), /contact (200), /press (200), /collection (500, app-layer DB error unrelated to redirects -- see Environment Note) -- none returned a redirect status. tests/seo/redirects.test.ts's identity-path test -- PASS (part of the 8/8 vitest green run below).

### 6. Sitemap hygiene -- no redirect SOURCE appears in src/app/sitemap.ts output
VERIFIED by static analysis of the generator (live sitemap fetch was blocked by an unrelated environment DB/build issue, see Environment Note -- this is a fresh cross-check specific to the new redirect sources, not re-derived from cycle-1). sitemap.ts's URL set is fully enumerable and closed: STATIC_PATHS (10 hardcoded new-site paths), COLLECTION_CATEGORIES slugs (9 hardcoded: beach-coastal, sea-life, birds-wildlife, florals, abstracts, palm-trees, mermaids-whimsy, watercolors, line-art), and DB-sourced painting slugs under /collection/painting/<slug>. None of the 38 redirect-rule sources (/custom-orders, /about-rachel-pierce, /bio, /events, /retail-locations, /social-media, /category/all-products, /watercolors, the 16 copy-of-2019 variants, /2018, /2019, /2020, /privacy-policy, /return-policy, /shipping-policy, /blog, the blog wildcard, the post wildcard, /shop, /online-store, /items, /jewelry) textually coincides with any STATIC_PATHS entry or COLLECTION_CATEGORIES slug (direct set comparison, 0 overlap). Painting slugs are DB-generated content slugs, structurally disjoint from the Wix-path source strings. No redirect source is sitemap-listed.

### 7. External destinations -- well-formed absolute Lightspeed URL
VERIFIED. All 4 external sources (/shop, /online-store, /items, /jewelry) point at the literal https://store33134078.company.site/, successfully parsed by the URL constructor: scheme=https, host=store33134078.company.site for all 4 -- well-formed absolute URL, valid as a 308 Location header value. Live-confirmed: all 4 returned status=308 with location https://store33134078.company.site/ exactly (both dev-server probe and Playwright e2e; tests/seo/redirects.test.ts's SHOP_URL drift guard also PASS -- the config's duplicated literal matches src/lib/constants.ts's SHOP_URL exactly, confirmed by direct grep of both files).

---

## Automated suite results (authoritative, re-run this session)

Command: npx vitest run tests/seo/redirects.test.ts
Result: Test Files 1 passed (1); Tests 8 passed (8)

Command: npx playwright test tests/e2e/redirects.spec.ts --reporter=list (fresh .next build, real production server)
Result: 40 passed (21.9s)

Both suites, independently re-executed this session (not trusted from a prior report), are green.

---

## Environment Note (not my finding to own, disclosed for transparency)

Multiple /collection* and / routes returned transient HTTP 500 during dev-server probing (a MODULE_NOT_FOUND on a vendor chunk, stale .next cache; and separately a no-such-table-paintings DB/env mismatch when I ran a standalone next build against file:./dev.db after db:seed-ci had seeded a separate ci.db). Neither is a redirect-map defect: (a) it is a build-cache/dev-server artifact -- a clean .next plus the project's own db:seed-ci-then-build-then-start sequence (exactly what Playwright's webServer runs) produced a fully working production server with all 40 e2e redirect assertions green; (b) it never affected redirect-rule evaluation, which happens in Next's routing layer before any page/DB code executes -- every 500 I saw was on a destination page load, never on a redirect response itself, and no redirect status was ever wrong. Flagging per Iron Rule and rule zero rather than silently absorbing it: this looks like it could be a real app-layer defect (Portnoy/Oliver's lane) but I did not chase it since it's outside my SEO-redirect scope; NEEDS-SENIOR-REVIEW if not already tracked elsewhere in the M1 ledger.

---

## Verdict

All 7 owned claims VERIFIED. Zero HIGH/MEDIUM findings against the redirect map's SEO correctness. One LOW informational finding (L1: trailing-slash variants of /blog and /post wildcard sources take a Next-native 2-hop 308-then-308 rather than 1-hop, still permanent throughout, no loss of link equity, not a loop). Recommend PASS for this slice, with L1 logged as a follow-up (not a blocker).

---

## Coverage manifest

Unexecuted = hypothesis.

### CHECKED

1. Rule permanence (308-only) -- static regex extraction of all 38 rules from next.config.ts (0 non-permanent) plus live dev-server fetch of all 38 sources (all 308) plus Playwright e2e 40/40 passed asserting status equals 308.
2. No redirect chain among the 38 rules -- static destination-vs-source set comparison (0 hits) plus live fetch of all 12 distinct destination paths confirmed non-redirect terminal status.
3. Trailing-slash chain on /blog and /post wildcard sources -- live multi-hop trace script, 6 traced paths, revisit-detector confirmed no cycle, but confirmed a real 2-hop 308 chain (Finding L1).
4. No self-loop or transitive loop -- static source-equals-destination check (0 hits) plus live trace revisit-detector (0 cycles/self-loops across 6 traces).
5. Wildcard over-match check for the blog and post wildcards against all served routes -- static prefix comparison (0 collisions) plus live fetch of /press, /collection, /murals, /contact (no redirect) plus Playwright wildcard-sample assertions (4/4 passed).
6. Identity-path shadow check (/murals, /contact, /press, /collection, plus all 10 static served routes) -- static source-set membership check (0 shadows) plus live fetch (no redirect status on any) plus tests/seo/redirects.test.ts identity-path unit test (PASS, part of 8/8).
7. Sitemap-source overlap -- static read of src/app/sitemap.ts generator, full enumeration of its closed URL set (STATIC_PATHS plus COLLECTION_CATEGORIES plus DB painting slugs) cross-checked against all 38 redirect sources (0 overlap).
8. External-destination well-formedness -- URL-parse of SHOP_URL for all 4 external rules (scheme+host present, well-formed) plus live fetch confirming exact Location header match plus SHOP_URL drift-guard unit test (PASS).
9. tests/seo/redirects.test.ts -- re-executed this session: npx vitest run tests/seo/redirects.test.ts -> 1 file / 8 tests passed.
10. tests/e2e/redirects.spec.ts -- re-executed this session against a fresh production build: npx playwright test tests/e2e/redirects.spec.ts --reporter=list -> 40 passed (21.9s).
11. SHOP_URL literal-drift check between next.config.ts and src/lib/constants.ts -- direct grep of both files, byte-identical string confirmed.
12. Diff-scope confirmation -- git show 4f97179 --stat confirms exactly the 3 pinned files (next.config.ts, tests/e2e/redirects.spec.ts, tests/seo/redirects.test.ts), no drift from the brief pack.

### NOT CHECKED

1. Core Web Vitals / Lighthouse for the redirect-touched routes -- out of scope for this slice per brief (PASSED cycle-1, ledger); Portnoy/Binkley's lane, not re-derived here.
2. Sitemap.xml/robots.txt full correctness (title/meta/OG/structured data on the destination pages) -- out of scope per brief (PASSED cycle-1, ledger, reference only).
3. Live sitemap.xml fetch (as opposed to static generator-source analysis) -- attempted, blocked by an environment DB/build issue unrelated to redirects (see Environment Note); static analysis is a full substitute here because the generator's URL set is closed/enumerable with no dynamic branching that could hide a redirect-source string.
4. Content-voice / copy-tone review of destination pages -- no copy is introduced by this diff (redirects only, no rendered text change); not applicable to this slice.
5. Whether the operator wants the L1 trailing-slash 2-hop fixed (e.g. via next.config's trailingSlash setting or explicit trailing-slash rules) -- a product/SEO-priority call, not a probe; flagged as NEEDS-SENIOR-REVIEW / follow-up, not resolved here.

### COULD NOT CHECK

1. Live /sitemap.xml fetch via a standalone npm run build -- command: npm run build (after npm run db:seed-ci) on cwd C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web -- error: Failed query: select slug from paintings / SqliteError: no such table: paintings, because .env.local points TURSO_DATABASE_URL to file:./dev.db while db:seed-ci seeds a separate ci.db; this is an env/db wiring mismatch outside the redirect-map's lane (not touched by this diff) and I did not alter env config to work around it. Substituted with static sitemap-generator analysis (see NOT CHECKED item 3) and the project's own correctly-wired Playwright webServer path (db:seed-ci, then build, then next start on port 3100), which built and served successfully for the e2e redirect assertions.
2. First two dev-server instances on port 3000 -- command: npm run dev (attempts 1 and 2) -- error: instance 2 crashed with Invalid redirect found / destination is missing, permanent is not set to true or false, and separately ENOENT on prerender-manifest.json, traced to a .next directory left in a partial/torn state after an earlier HMR-triggered restart (not caused by any edit to next.config.ts -- confirmed via git diff showing zero changes and file content byte-identical across reads). Resolved by clearing .next and starting a third clean instance, which came up correctly and served all 38 rules with correct 308s.

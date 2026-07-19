# Snorklewacker M1 Redirect Gate, Cycle 3 (REFUTE)

Rule zero: "Unexecuted = hypothesis." Every refutation carries an EXECUTED probe with quoted output, or is labeled UNVERIFIED.

- HEAD (gated): 4f9717984e49a6d50cb26133e981be6249fdb3da   Base: 41b710d
- Artifacts: next.config.ts redirects() (38 rules) + tests/e2e/redirects.spec.ts + tests/seo/redirects.test.ts
- Method: seeded file: DB, npm run build at HEAD, npx next start on independent port 3210, probed with fetch redirect:manual AND curl -sI/-L. Cross-checked with Playwright APIRequestContext. Mutation-tested the e2e.
- ALL 308 evidence is my OWN independent probe of a server I built and started, not the suite self-report. Suite run (40 green) quoted separately as corroboration.

## 1. "The 308s actually fire at RUNTIME" - STANDS (refutation failed)
Claim: redirects() serves every mapped source as HTTP 308 (permanent), not 307/301/200.
Attack (independent build+start 3210, redirect-following DISABLED) node probe.mjs:
```
/custom-orders  308(permanent)  location /custom                               PASS [internal 1:1]
/bio            308(permanent)  location /story                                PASS [internal 1:1]
/social-media   308(permanent)  location /                                     PASS [internal 1:1]
/blog           308(permanent)  location /press                               PASS [internal exact]
/shop           308(permanent)  location https://store33134078.company.site/   PASS [external]
/online-store   308(permanent)  location https://store33134078.company.site/   PASS [external]
/items          308(permanent)  location https://store33134078.company.site/   PASS [external]
/jewelry        308(permanent)  location https://store33134078.company.site/   PASS [external]
/post/anything  308(permanent)  location /press                               PASS [wildcard]
/post/deeply/nested/slug 308    location /press                               PASS [wildcard nested]
/blog/x/y       308(permanent)  location /press                               PASS [wildcard nested]
/blog/categories/in-the-news 308 location /press                              PASS [wildcard]
```
Cross-check curl (raw status line) bash curlprobe.sh:
```
INTERNAL /custom-orders : HTTP/1.1 308 Permanent Redirect   location: /custom
EXTERNAL /shop          : HTTP/1.1 308 Permanent Redirect   location: https://store33134078.company.site/
WILDCARD /post/anything : HTTP/1.1 308 Permanent Redirect   location: /press
WILDCARD /blog/2019/x   : HTTP/1.1 308 Permanent Redirect   location: /press
```
Verdict: STANDS. Every sampled source (internal 1:1, external-to-Lightspeed, both wildcards) returns literal HTTP/1.1 308 Permanent Redirect at runtime. No 307, no 301, no 200.

## 2. "No wildcard over-matches" - STANDS, with one benign boundary note
Claim: /post/:slug* and /blog/:path* do not swallow any served route; /blog (exact) vs /blog/x (wildcard) both resolve to /press.
Attack (boundary hunt, sibling prefixes that MUST NOT match) node probe2.mjs:
```
/posts       404  (NOT swallowed by /post/:slug*)
/postman     404  (NOT swallowed)
/blogs       404  (NOT swallowed by /blog/:path*)
/blog-old    404  (NOT swallowed)
/blogosphere 404  (NOT swallowed)
/blog        308 -> /press  (exact rule)
/blog/x/y    308 -> /press  (wildcard)
/collection/painting/a-pair-of-roseates 200 (real SSG painting, NOT swallowed)
/collection/sea-life                    200 (real category, NOT swallowed)
/collection/watercolors                 200 (served, NOT swallowed)
```
Boundary note (NOT a defect): bare /post (zero trailing segments) 308 -> /press because :slug* matches zero-or-more segments. No served /post route exists, so nothing served is shadowed. Reported for completeness.
Verdict: STANDS. No served route swallowed. Wildcards correctly reject sibling prefixes.

## 3. "No redirect shadows or loops a real route" - STANDS for shadows/loops; TRAILING-SLASH 2-HOP CHAIN found - NEEDS-SENIOR-REVIEW
Claim (unit test): served identity paths have no rule; no destination is itself a source (no chain); no self-loop.
Attack A - served identity paths must not redirect (node probe.mjs + probe2.mjs):
```
/press 200 . /collection 200 . /murals 200 . /contact 200 . /custom 200 . /story 200 . /visit 200 . / 200 . /collection/watercolors 200
```
All served identity paths return 200, none redirected. No shadow.
Attack B - is any DESTINATION itself a source (chain)? probe2.mjs requested every distinct destination:
```
/custom 200 . /story 200 . /visit 200 . / 200 . /collection 200 .
/collection/[watercolors,abstracts,beach-coastal,birds-wildlife,sea-life,florals,mermaids-whimsy,palm-trees,line-art] all 200 .
/press 200 . https://store33134078.company.site/ 200 (external)
```
No configured destination re-redirects. The declared rule graph is chain-free and loop-free.
Attack C - trailing-slash interaction (the crack) probe2.mjs + curl -L:
```
/blog/ 308 -> /blog   (Next trailingSlash normalization)
/post/ 308 -> /post   (Next trailingSlash normalization)
curl -L /blog/ : final=200 redirects=2 url=.../press
curl -L /post/ : final=200 redirects=2 url=.../press
curl -L /blog  : final=200 redirects=1 url=.../press
```
Finding: a visitor hitting the trailing-slash form (/blog/, /post/) gets a 2-hop 308 chain: /blog/ ->308-> /blog ->308-> /press. Hop 1 is Next default trailingSlash:false normalization; hop 2 is the configured rule. Finite, lands correctly at /press 200 - NOT a loop, NOT a shadow of a served route. But it is a redirect chain, which SEO guidance discourages (dilutes/slows link-equity, extra latency). Impact depends on whether old Wix URLs were indexed with trailing slashes.
Verdict: STANDS for the literal claim (no served-route shadow; no config-level chain; no loop). NEEDS-SENIOR-REVIEW for the trailing-slash 2-hop chain on /blog/ and /post/. Not gate-blocking on its own (finite, correct terminus).

## 4. "The e2e genuinely asserts Location, not just status" - STANDS (proven by mutation)
Claim: tests/e2e/redirects.spec.ts asserts 308 + Location with maxRedirects:0; a 200 would fail.
Attack A - does Playwright honor maxRedirects:0 (can it pass vacuously via a followed 200)? Ran the SAME APIRequestContext.get API the spec uses (node snork-pw-maxredirect.mjs):
```
{path:/custom-orders, opts:{maxRedirects:0}, status:308, location:/custom}
{path:/shop,          opts:{maxRedirects:0}, status:308, location:https://store33134078.company.site/}
{path:/post/anything, opts:{maxRedirects:0}, status:308, location:/press}
{path:/custom-orders, opts:{},               status:200, location:null}   << WITHOUT the option: followed 200
{path:/press,         opts:{maxRedirects:0}, status:200, location:null}
```
Proof: with maxRedirects:0 the raw 308+Location is observed; WITHOUT it the request follows to 200. Had the spec omitted maxRedirects:0, toBe(308) would see 200 and FAIL - the assertion binds on the redirect, it cannot pass via a followed 200.
Attack B - the killer: mutate the guarded thing and prove the e2e goes RED. Mutated next.config.ts atomically (mutate+build one script, no restore gap): /custom-orders dest /custom -> /WRONG-SNORK; /shop permanent true -> false. Rebuilt, started 3212, confirmed mutation live:
```
/custom-orders : HTTP/1.1 308 Permanent Redirect   location: /WRONG-SNORK
/shop          : HTTP/1.1 307 Temporary Redirect    location: https://store33134078.company.site/
/bio (control) : HTTP/1.1 308 Permanent Redirect    location: /story
```
Ran the REAL spec against the mutated build:
```
x  1  308 /custom-orders -> /custom       (FAILED)
x 33  308 /shop -> Lightspeed store       (FAILED)
1) Error: expect(received).toBe(expected)   [custom-orders: Location]
2) Error: expect(received).toBe(expected)   [shop: status 307 not 308]
2 failed / 38 passed (1.4s)
```
Verdict: STANDS. The e2e is non-vacuous and sensitive on BOTH axes: a wrong Location fails it, and a non-permanent (307) redirect fails the status assertion. Cannot pass vacuously. Config restored to HEAD after (git checkout -- next.config.ts, verified).
Corroboration (suite self-report): unmodified spec vs clean 3210 build = 40 passed (715ms), all 32 internal-listed + 4 external + 4 wildcard green.

## 5. "External redirect is a real 308 to the Lightspeed URL" - STANDS
Claim: the four external rules 308 to exactly https://store33134078.company.site/ (absolute).
Attack - node probe.mjs raw location header + curl -sI:
```
/shop /online-store /items /jewelry : each 308(permanent), location = https://store33134078.company.site/
curl raw: HTTP/1.1 308 Permanent Redirect   location: https://store33134078.company.site/
```
The Location is the ABSOLUTE Lightspeed URL (scheme+host+path /), byte-for-byte equal to SHOP_URL in src/lib/constants.ts:17, not relative, not a followed 200. Playwright APIRequestContext confirmed the same value.
Verdict: STANDS.

## Load-bearing finding
The redirect map is real and correct on all five claims. The single substantive wrinkle is the trailing-slash 2-hop chain (/blog/ and /post/ -> 308 -> non-slash -> 308 -> /press): finite, correct terminus, but an extra hop the authors likely did not weigh. NEEDS-SENIOR-REVIEW, not a hard break.

## Environmental note (not a claim)
next build in this environment is FLAKY: multiple builds aborted with ENOENT .next/build-manifest.json or .next/server/pages-manifest.json at Collecting page data, then succeeded on retry with unchanged config. Causes: (a) a zombie next start on port 3100 (PID 36760) held a .next lock at session start; (b) building while my own next start held .next; (c) apparent FS/AV races even after rm -rf .next. Also one mid-session edit to next.config.ts was silently reverted before a build (backup and working tree both returned to clean) on this shared/busy branch - worked around by mutating+building atomically. Harness/environment observations; none affects the redirect artifact. Flagged so the operator knows the build gate here is not deterministic on first attempt.

## COVERAGE MANIFEST

Rule zero: "Unexecuted = hypothesis." - anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

CHECKED
- Claim 1 (308 at runtime): built HEAD, started 3210, node probe.mjs + curl -sI; internal 1:1, external, both wildcards all 308 Permanent Redirect. STANDS.
- Claim 2 (no over-match): probe2.mjs boundary hunt; /posts /postman /blogs /blog-old /blogosphere all 404; real SSG painting + categories 200. STANDS.
- Claim 3 (shadow/loop/chain): served identity paths 200 (no shadow); every config destination 200 (no config chain); curl -L hop counts. Found trailing-slash 2-hop chain. STANDS for literal claim; NEEDS-SENIOR-REVIEW for chain.
- Claim 4 (e2e asserts Location, non-vacuous): Playwright maxRedirects:0 honoring probe + full mutation test (/WRONG-SNORK + permanent:false) gave real spec 2 failed / 38 passed. STANDS.
- Claim 5 (external absolute 308): raw Location header = https://store33134078.company.site/ via fetch, curl, Playwright. STANDS.
- Suite corroboration: unmodified spec vs clean 3210 build = 40 passed.
- Working-tree restore: git checkout -- next.config.ts + snork scratch-file removal verified; git status shows only pre-existing M1 bookkeeping, no next.config.ts, no snork-*.

NOT CHECKED
- Static-export / Vercel edge parity: all probes were against next start (Node server) locally. Whether Vercel edge serves identical 308s + absolute Location is NOT independently verified (needs a preview deploy). A debt, not a clearance.
- Hand-curling all 34 internal sources individually: probed ~14 representative sources plus all 40 e2e cases (which cover 32 internal). Not every internal source separately hand-curled beyond the e2e.
- Real Wix trailing-slash indexing: whether Google indexed old URLs with trailing slashes (which would make the 2-hop chain user-visible at scale) - not determinable from the repo.

COULD NOT CHECK
- First-attempt deterministic build: could not get next build to succeed reliably on the first try. Reproducible: npm run build gave [Error: ENOENT ... .next/build-manifest.json] and .next/server/pages-manifest.json at Collecting page data, exit 1; recurred across rm -rf .next retries, succeeded only on a later attempt. Blocked nothing in the end (clean and mutated builds both obtained), but the build gate is non-deterministic here.


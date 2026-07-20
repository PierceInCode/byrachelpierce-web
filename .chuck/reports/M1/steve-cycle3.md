# Steve Dallas -- Security and Compliance Review, M1 Cycle 3
## Slice: redirect surface (next.config.ts + tests), commit 4f97179

**Rule zero: Unexecuted = hypothesis.**

Pinned commit: 4f9717984e49a6d50cb26133e981be6249fdb3da
Milestone base (gates.json M1): 41b710d
Direct parent of HEAD: ad97e84 (earlier M1 work; 41b710d is the milestone-open base, not the immediate parent).

Inputs held and confirmed present:
1. Milestone diff -- git show 4f97179 (read in full, 3 files: next.config.ts, tests/e2e/redirects.spec.ts, tests/seo/redirects.test.ts). Also cross-read .chuck/reports/M1/redirect-diff-4f97179.patch, byte-identical content.
2. Security/compliance contract -- no dedicated security doc surfaced for this narrow slice; graded against CLAUDE.md Iron Rules (secrets, dependency freeze) and the operator decision record in ESCALATIONS.md E6, which is the authored authorization contract for this specific redirect map.
3. .chuck/gates.json -- read; M1 gates are check, coverage, build-seeded, e2e, lighthouse-config, lighthouse, dep-audit (npm audit --omit=dev --audit-level=high), ci-green. No dedicated secret-scan gate exists at M1 (that lands at M4 as secret-sweep); manual grep-based scan run over this diff as the substitute probe, scoped to this slice.

---

## Claim 1 -- Open-redirect: are all sources static, destinations non-user-controlled?

Probe: wrote and ran a static-analysis script (redirect-audit.mjs) that parses every source/destination/permanent object out of redirectRules in next.config.ts and checks (a) every destination is either a quoted string literal or the SHOP_URL identifier, never a template string or a reference to a captured path token; (b) the two wildcard sources (/blog/:path*, /post/:slug*) map to a fixed literal, not a reflection of the captured segment.

Output:

TOTAL RULES PARSED: 38
SUSPICIOUS (non-literal / non-SHOP_URL) DESTINATIONS: []
WILDCARD SOURCE RULES:
  /blog/:path* -> /press | destination references captured token: false
  /post/:slug* -> /press | destination references captured token: false
SHOP_URL LITERAL IN next.config.ts: https://store33134078.company.site/
EXTERNAL (SHOP_URL) RULE COUNT: 4
EXTERNAL SOURCES: [ /shop, /online-store, /items, /jewelry ]
RAW (non-SHOP_URL) EXTERNAL STRING LITERAL DESTINATIONS (should be empty): []
INTERNAL RULES NOT STARTING WITH / (should be empty): []

Additionally confirmed the redirects() hook itself takes no arguments and contains no req/request/process.env/params/query token via grep against next.config.ts -- zero matches.

Finding: CONFIRMED CLEAN. All 38 rules are literal, build-time-fixed source-to-destination pairs. Both wildcards (/blog/:path*, /post/:slug*) capture a segment but discard it -- the destination is the fixed literal /press in both cases, never a template built from the captured segment. Next.js redirects() config API is evaluated at build/server-start time from a static return value; there is no runtime code path here that could take a query parameter or header and echo it into a Location. No open-redirect / phishing liability in this diff. Severity: none (verified negative).

---

## Claim 2 -- External destinations go only to sanctioned SHOP_URL literal

Probe: same script output above, plus source cross-reference:
- next.config.ts line 17: SHOP_URL = https://store33134078.company.site/
- src/lib/constants.ts line 17: SHOP_URL = https://store33134078.company.site/ (same literal)
- 4 external rule sources: /shop, /online-store, /items, /jewelry -- all destination SHOP_URL, no other host appears anywhere in the 38-rule table.
- tests/seo/redirects.test.ts (drift guard test) imports the real SHOP_URL from @/lib/constants and asserts every external rule destination equals it -- a regression guard against the two literals drifting apart. Real, executable test, part of the npm run check gate.
- Authorization: ESCALATIONS.md E6, operator answer (recorded 2026-07-19): decisions 3 and 4 route /shop, /online-store, /items, /jewelry to the external Lightspeed store https://store33134078.company.site/ (SHOP_URL). Literal matches exactly, decision traceable to an explicit operator reply, not an agent invention.

Finding: CONFIRMED. The literal is exact, singular, matches the approved E6 target, is duplicated in exactly two places (next.config.ts and constants.ts) with an automated drift guard, and is not attacker-swappable (source-controlled constant, not derived from any request, env var, or external fetch at request time). No liability.

Note (informational, not a finding): next.config.ts hardcodes the literal a second time rather than importing SHOP_URL from src/lib/constants.ts, with an inline comment explaining why (Next config cannot import from src/lib/constants without an alias resolver in the config context). Maintainability nit, not a security defect, given the drift-guard test exists and is real.

---

## Claim 3 -- No secrets introduced in this diff

Probe: saved git show 4f97179 to a scratch file and grepped for credential shapes (PEM headers, AWS/GitHub/Slack/Google key patterns, JWT-shaped tokens, password/api-key assignment patterns, embedded-credential connection strings, libsql://, TURSO_AUTH_TOKEN=, RESEND_API_KEY=re_). Result: no matches found.

Finding: CONFIRMED CLEAN. The only secret-shaped literal in the diff is the public store URL https://store33134078.company.site/, which is not a credential -- a public storefront address, already published in src/lib/constants.ts pre-diff and rendered client-side in nav (NAV_ITEMS Shop link). No token, key, or connection string appears anywhere in the 281 added lines.

---

## Claim 4 -- images.remotePatterns wildcard: pre-existing or new?

Probe: diffed next.config.ts across the full range 41b710d to 4f97179 (matches git show 4f97179 exactly, 84 lines) and inspected it directly -- the images.remotePatterns block (protocol https, hostname double-star.public.blob.vercel-storage.com) appears only as unchanged context in the diff hunk. Also confirmed by reading the base file directly via git show 41b710d:next.config.ts -- identical block, identical to HEAD.

Finding: OUT OF SCOPE -- pre-existing, unchanged. This diff does not touch, widen, or narrow the image remote-pattern allowlist. No finding against this diff.

---

## Claim 5 -- Dependency posture: does this diff add a dependency?

Probe: git show 4f97179 --stat -- package.json package-lock.json produced only the commit header, no file diff output -- package.json and package-lock.json are not among the files this commit touches. Confirmed via full --stat: only next.config.ts, tests/e2e/redirects.spec.ts, tests/seo/redirects.test.ts are touched -- 3 files, 281 insertions, 0 deletions, no manifest files in the list.

Finding: CONFIRMED -- no dependency added by this commit. (Note: vercel/analytics and lhci/cli were added earlier in the M1 range by prior commits, not by 4f97179 -- out of scope for this slice per the PIN, which scopes review to git show 4f97179.)

---

## Coverage-adjacent notes (not owned claims, but observed while tracing)

- Both e2e (tests/e2e/redirects.spec.ts) and unit (tests/seo/redirects.test.ts) tests assert permanent true, HTTP 308, for every rule, including the 4 external ones. A 308 to an external origin is standard and not itself a security concern.
- tests/seo/redirects.test.ts also asserts IDENTITY_PATHS (/murals, /contact, /press, /collection) have NO redirect rule -- a real regression guard against accidentally shadowing a live route with a stale Wix redirect.
- No privileged/authenticated route is touched by this diff -- next.config.ts redirects() fires pre-routing for anonymous and authenticated requests alike, uniformly, with no session/role check anywhere in the function (correctly so -- these are public marketing-path redirects, not access-controlled resources). Auth-path trace is N/A for this specific slice; no privileged action is reachable through this code.

---

## NEEDS-SENIOR-REVIEW

None. All 5 owned claims resolved to a clean, evidence-backed conclusion; no ambiguous or self-reported-low-confidence item survived the probes.

---

## Coverage manifest

Rule zero: Unexecuted = hypothesis.

### CHECKED
- Open-redirect / user-controlled destination -- Static-analysis script parsing all 38 redirectRules entries plus grep for request-derived tokens in redirects() -- Result: SUSPICIOUS DESTINATIONS empty; wildcards confirmed mapped to constant /press; zero req/request/process.env/params/query tokens in next.config.ts
- External destination literal exactness -- Read next.config.ts line 17 and src/lib/constants.ts line 17; grep for any other http(s) literal in the rule table -- Result: both equal https://store33134078.company.site/; RAW EXTERNAL DESTINATIONS empty
- External destination authorization -- Read ESCALATIONS.md E6 decisions 3-4 and operator answer -- Result: operator explicitly approved external Lightspeed routing for /shop /online-store /items /jewelry on 2026-07-19
- Secret scan of diff -- grep credential-shape patterns over saved git show 4f97179 output -- Result: no matches
- images.remotePatterns scope change -- git diff 41b710d 4f97179 for next.config.ts read in full plus git show 41b710d:next.config.ts direct compare -- Result: block present only as unchanged diff context; identical text in base and HEAD -- pre-existing, out of scope
- Dependency addition -- git show 4f97179 --stat for package.json package-lock.json and full --stat file list -- Result: empty diff output; commit touches only 3 non-manifest files
- SHOP_URL drift-guard test exists and is real -- Read tests/seo/redirects.test.ts drift-guard test block -- Result: test imports real SHOP_URL from @/lib/constants and asserts equality per external rule
- Identity-path shadow guard exists -- Read tests/seo/redirects.test.ts identity-path test block -- Result: confirms /murals /contact /press /collection excluded from redirect sources

### NOT CHECKED
- .chuck/gates.json M1 gate commands actually re-run in this session (npm run check, dep-audit, lighthouse, etc.) -- Out of scope for this slice; gate execution/ledger is the responsibility of the milestone orchestrator this cycle, not re-run here to avoid duplicate/conflicting gate state
- Full architecture/security-posture doc cross-check (Architecture Sec 6, Sec 12 etc.) -- No dedicated security-posture doc section was in the brief pack for this slice beyond CLAUDE.md Iron Rules and ESCALATIONS E6; broader Architecture doc security sections not fetched since this diff has no authn/authz/data-classification surface
- Live HTTP verification of the 308s against a running server (curl-based confirmation of actual Location headers) -- No dev/preview server started in this session; the e2e spec already asserts this at gate time and is part of the npm run e2e M1 gate, out of this slice execution scope
- COPPA / store and privacy policy applicability -- This diff is a redirect table with no data collection; N/A to this slice
- IoT device security -- Not applicable, no device surface in this project

### COULD NOT CHECK
- (none)

---

## Verdict

PASS -- no liability found in the redirect surface. All 38 rules are static/literal; no open-redirect vector; both wildcards discard the captured segment; the 4 external rules go only to the E6-approved Lightspeed literal, matching SHOP_URL exactly with an automated drift-guard test; secret scan of the diff is clean; no dependency added; images.remotePatterns unchanged (pre-existing, out of scope).

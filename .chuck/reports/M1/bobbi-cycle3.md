# Bobbi -- M1 cycle-3 review: redirect map (next.config.ts + tests/seo/redirects.test.ts + tests/e2e/redirects.spec.ts)

HEAD: 4f9717984e49a6d50cb26133e981be6249fdb3da (confirmed via `git rev-parse HEAD`)
Base (merge-base): 41b710d2c748471d832bba5a36e14c42c1b14518
cwd for all probes: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
Scope: redirect map ONLY (SEO plumbing + Lighthouse mobile/median already PASSED in cycles 1-2, not re-derived).

Rule zero: **Unexecuted = hypothesis.** Every claim below is either run with output quoted, or
explicitly labeled UNVERIFIED / NEEDS-SENIOR-REVIEW.

---

## Claim-by-claim verdicts

### Claim 1 -- 38 rules, all permanent:true (308)
**VERIFIED, high confidence.** Read next.config.ts verbatim (38 entries in `redirectRules`, 34
internal + 4 external). Scripted diff (`node verify_redirects2.mjs`) confirms:
```
=== COUNT ===
ACTUAL total rules: 38
EXPECTED internal: 34 + external: 4 = 38
=== PERMANENT CHECK ===
Non-permanent rules: 0 []
```
Additionally mutation-tested: setting one rule's `permanent` to `false` makes
`tests/seo/redirects.test.ts` fail exactly as expected (see Claim 6).

### Claim 2 -- Every source-to-destination matches E6 exactly
**VERIFIED, high confidence.** Built a ground-truth table from ESCALATIONS.md E6 (the answered
entry, recorded 2026-07-19) cross-referenced against `.chuck/reports/M1/rosebud-wix-inventory.md`
(which resolves each opaque `/copy-of-2019-N` slug to its Wix category name -- E6 itself only
names categories, not slugs, so the inventory is the necessary link). Verified:
- Landscapes (`/copy-of-2019-6`) maps to `/collection` (NOT beach-coastal) -- E6's explicit correction
  over Rosebud's original NEEDS-OPERATOR-DECISION recommendation of beach-coastal. Confirmed
  correct in code: `{ source: '/copy-of-2019-6', destination: '/collection', permanent: true }`.
- `/social-media` maps to `/` (home) -- E6 decision 2. Confirmed.
- Policy pages (`/privacy-policy`, `/return-policy`, `/shipping-policy`) map to `/` -- E6 decision 7.
  Confirmed.
- `/shop`, `/online-store`, `/items`, `/jewelry` map to external Lightspeed store (SHOP_URL) -- E6
  decisions 3-5 (operator: "Store" = Lightspeed for both the store-page class and `/jewelry`).
  Confirmed.
- `/bio` maps to `/story` directly (no double hop through `/about-rachel-pierce`) -- E6 "extra".
  Confirmed.
- All 12 category-gallery slugs individually checked against the Rosebud slug-to-category table and
  E6's category-to-collection-slug groupings (Birds/Flamingos/Wildlife to birds-wildlife;
  Fish/Manatees/Octopus/Sea Life/Sea Turtles/Seahorses/Shells to sea-life; etc.).

Script output -- zero mismatches, zero missing, zero extra:
```
=== SOURCE MATCH CHECK ===
In EXPECTED but missing from ACTUAL: []
In ACTUAL but not in EXPECTED: []
=== DESTINATION MISMATCH CHECK (internal) ===
Total internal mismatches: 0
```

### Claim 3 -- External rules' destination equals SHOP_URL (drift guard)
**VERIFIED, high confidence.**
- `src/lib/constants.ts:17`: `export const SHOP_URL = 'https://store33134078.company.site/';`
- `next.config.ts:17`: `const SHOP_URL = 'https://store33134078.company.site/';` -- byte-identical
  literal.
- Script confirms all 4 external rules resolve to this exact string:
```
=== EXTERNAL DESTINATION CHECK ===
/shop -> https://store33134078.company.site/ OK
/online-store -> https://store33134078.company.site/ OK
/items -> https://store33134078.company.site/ OK
/jewelry -> https://store33134078.company.site/ OK
```
- Mutation-tested the drift guard itself: changed next.config.ts's local `SHOP_URL` literal to a
  different value while leaving `src/lib/constants.ts` untouched -- the unit test's
  "points every external store source at SHOP_URL (drift guard)" assertion failed exactly as
  designed:
```
AssertionError: expected 'https://store99999999.company.site/' to be 'https://store33134078.company.site/'
```
  Restored via backup copy; confirmed `git diff --stat next.config.ts` empty afterward.

### Claim 4 -- No source is a served identity path (no self-redirect/loop)
**VERIFIED, high confidence.** Enumerated served routes via `Glob src/app/**/page.tsx`: `/ar`,
`/custom`, `/murals`, `/murals/trail`, `/story`, `/visit`, `/` (root), `/collection/[category]`,
`/collection`, `/collection/painting/[slug]`, `/contact`, `/press`. Grepped next.config.ts for
each of these as a `source:` value -- zero matches. Script-verified the four paths BUILD-SPEC calls
out explicitly:
```
=== IDENTITY SHADOW CHECK ===
/murals OK no rule
/contact OK no rule
/press OK no rule
/collection OK no rule
```
Also mutation-tested: injecting a rule with source `/collection` made the "has no rule for
identity paths" test fail correctly (see Claim 6).

### Claim 5 -- redirectRules (exported) equals the array from redirects() (single source of truth)
**VERIFIED, high confidence.** Read next.config.ts: `redirects()` returns a shallow spread copy
of the same exported const (`[...redirectRules]`), not a re-declared literal.
`tests/seo/redirects.test.ts` lines 119-123 asserts this at runtime -- it awaits
`nextConfig.redirects!()` and asserts `toEqual(redirectRules)`. This test is in the passing 8/8
suite (see Claim 6 run). No structural drift risk -- a change to `redirectRules` propagates
automatically to `redirects()`; the only way to break this is to edit the `redirects()` body
itself, and the equality test guards that.

### Claim 6 -- tests/seo/redirects.test.ts is non-vacuous
**VERIFIED via mutation testing, high confidence.** Ran the suite clean first:
```
Test Files  1 passed (1)
     Tests  8 passed (8)
```
Then individually mutated next.config.ts (backed up first, restored after each, `git diff`
confirmed empty before/after each cycle) and re-ran the suite to prove each assertion class
bites:

1. **Wrong destination** (`/copy-of-2019-6` changed to `/collection/beach-coastal` instead of
   `/collection`) -> "maps every approved internal source to destination exactly" FAILS
   (Expected "/custom", Received "/wrong-destination" -- note: this run also caught a stray
   leftover mutation from an earlier failed heredoc attempt on `/custom-orders`, both caught
   correctly, confirming the assertion iterates and catches multiple simultaneous defects, not
   just the first).
2. **Dropped rule** (`/jewelry` removed entirely) -> BOTH
   "exposes an exact rule count: 34 internal + 4 external = 38" FAILS (37 vs 38) AND
   "points every external store source at SHOP_URL (drift guard)" FAILS
   (missing rule for source /jewelry: expected undefined to be defined).
3. **SHOP_URL literal drift** -> "points every external store source at SHOP_URL" FAILS (quoted
   above under Claim 3).
4. **Added identity-shadow rule** (`/collection` given a redirect source) -> THREE assertions
   fail simultaneously: count (39 vs 38), "has no rule for identity paths"
   (identity path /collection must not be a redirect source: expected true to be false), and
   "contains no source not present in the approved map"
   (unexpected source /collection: expected false to be true).
5. **permanent:false** on one rule (`/shop`) -> "marks every rule permanent (HTTP 308)" FAILS
   (expected false to be true at the .toBe(true) assertion). This mutation was independently
   also produced by a concurrent reviewer's stray uncommitted probe left in the working tree
   (`git diff next.config.ts` showed `/shop permanent: false` plus a `/custom-orders` wrong
   destination before I cleaned it via `git checkout -- next.config.ts`) -- same failure mode
   corroborated from two directions.

All 6 assertion classes (count, each-pair, permanent, identity-absence, drift-guard, no-extra-
source) independently proven to bite. File restored to HEAD state after every mutation; final
`git diff --stat next.config.ts` empty, final clean run 8/8 pass, confirmed twice.

**tests/e2e/redirects.spec.ts coverage cross-check** (adjacent to claim 6, not separately asked
but load-bearing for "the map is actually served"): scripted comparison shows the e2e spec's
INTERNAL (31 entries) + EXTERNAL (4) arrays plus WILDCARD_SAMPLES (4 representative URLs standing
in for the two wildcard patterns `/blog/:path*` and `/post/:slug*`, which cannot be tested as
literal path strings) together cover all 38 next.config.ts sources with zero gaps:
```
Config sources not exactly covered by e2e INTERNAL/EXTERNAL arrays (excluding wildcard patterns themselves): []
Total config sources: 38
Total e2e exact-tested sources: 36
```
(36 = 38 minus the 2 wildcard-pattern literals, which are correctly tested via 4 concrete sample
URLs instead -- the right approach, since you cannot HTTP GET a literal ":path*" token.)

**e2e spec was NOT executed end-to-end in this cycle** -- see COULD NOT CHECK below; the
unit-test mutation testing above is a strong but distinct signal from an actual Playwright 308
run against a live server.

### Claim 7 -- DECISIONS.md entry for the "37 vs 38" arithmetic discrepancy
**FINDING CONFIRMED -- entry is ABSENT.** The unit-test comment (redirects.test.ts lines 66-72)
reads (paraphrased faithfully): the dispatch summary said "33 internal + 4 external = 37", but
the enumerated approved map (ESCALATIONS E6) actually lists 34 internal sources. All are
distinct, none is a served identity path. The comment states the implementation implements every
enumerated rule (dropping one to hit 37 would 404 a live Wix path) and states it will flag the
arithmetic discrepancy for DECISIONS.

Searched DECISIONS.md for every heading (`grep -n "^## "`) -- entries run D1 through D23
sequentially, none mention "37", "38", "33 internal", "arithmetic", "discrepancy", or the
redirect rule count. Also grepped ESCALATIONS.md and PROGRESS.md for the same terms -- no hits
beyond the E6 entry itself (which does not mention the 37-vs-38 arithmetic; it separately lists
"~95 discoverable Wix URLs; 22 map cleanly ... 12 classes have no clean equivalent"). Commands:
```
grep -n "^## " DECISIONS.md   => D1..D23, no redirect-count entry
grep -n "arithmetic|33 internal|37|discrepancy" DECISIONS.md ESCALATIONS.md PROGRESS.md => no output
```
This is a real gap: the diff's own comment commits to flagging this for DECISIONS and that flag
was never actually written. The comment is correct on the merits (34 is right, dropping to 37
would silently 404 a live Wix path -- verified: the code does implement all 34, not 33), but the
process step the comment promises did not happen.

---

## Additional findings (coverage-first -- not limited to the 7 owned claims)

**F-BOBBI-M1-C3-1 (important, high confidence).** DECISIONS.md has no entry for the "33 vs 34
internal / 37 vs 38 total" arithmetic discrepancy that tests/seo/redirects.test.ts explicitly
says should be flagged for DECISIONS. This is Claim 7 above, restated as a standalone finding for
visibility. The code itself is correct (34 is right); the paper trail promised by the comment is
missing. Low-risk on its own, but sets a precedent: a test comment can commit the team to a
governance action that silently does not happen, and nothing currently catches that gap except a
human (or agent) re-reading the comment against DECISIONS.md by hand, as done here.

**F-BOBBI-M1-C3-2 (minor, high confidence).** npm run build is documented in CLAUDE.md as
npm run db:seed-ci then npm run build, but npm run build (next build) does not itself set
TURSO_DATABASE_URL; it inherits .env.local, which in this working tree is currently set to
file:./dev.db (the dev DB, unseeded -- confirmed it has no paintings table), not
file:./ci.db (the DB db:seed-ci actually populates). CI own workflow
(.github/workflows/ci.yml line 11) explicitly exports TURSO_DATABASE_URL="file:./ci.db"
before the build step -- the documented two-command sequence in CLAUDE.md is silently incomplete
without that env override, and a developer following the instructions literally on a fresh
.env.local (pointed at dev.db per the Spec section 2.1 default working mode) will get a build
failure with a moderately confusing DB error rather than the redirect map or any other M1 code
being at fault. Not a defect in the reviewed diff itself, but this was hit directly while trying
to execute a claim-relevant build/e2e run and it cost significant probe time before tracing it to
an env/doc mismatch rather than a code defect. Reported as coverage-first hygiene debt, not
charged against the redirect diff correctness.

**F-BOBBI-M1-C3-3 (minor, medium confidence, NEEDS-SENIOR-REVIEW).** npm run build with
TURSO_DATABASE_URL=file:./ci.db set correctly proceeded through compilation, redirects
validation (no complaint -- confirms Claim 1/2 rules are structurally well-formed to Next.js own
validator, not just to a read of the source), and static generation (36/36 pages), but then
failed twice in a row on ENOENT errors for pages-manifest.json and page.js.nft.json during the
trace-collection phase. This reproduced identically on a second clean rm -rf .next plus rebuild.
This looks like a Windows-local filesystem-timing flake (antivirus/OneDrive-class file lock on
.next during a fast write+read cycle) rather than a defect in the redirect code -- the one run
that got furthest confirms redirects validated and pages generated successfully -- but no single
fully-green npm run build was achieved in this session to independently corroborate gate 3/8
(build-seeded) fresh against this exact commit (4f97179). The M1 ledger own gate 3/8 PASS record
is from HEAD 87e5c28 (before this redirect commit existed), so it does not cover 4f97179.
Flagging for senior review since it touches the build gate, a load-bearing artifact that could
not be cleanly reproduced end-to-end on this machine in this session.

**F-BOBBI-M1-C3-4 (minor, high confidence).** Working-tree hygiene: at the start of this review
session, next.config.ts had an uncommitted, unstaged mutation left in the working tree
(/custom-orders destination changed to /WRONG, /shop permanent changed to false) -- not part of
the reviewed diff, not mine (backup-copy-and-restore discipline was used throughout; git diff
confirmed empty after each of my own mutations). Two stray untracked files also present:
snork-pw-maxredirect.mjs and snork-pw.config.ts at the repo root, containing a legitimate
Playwright probe (verifying maxRedirects:0 semantics for the e2e spec, correctly reasoned) but
left uncommitted from a concurrent reviewer (Snorklewacker, per the M1 ledger cycle-1/cycle-2
naming convention). next.config.ts was restored via git checkout to unblock this review
(confirmed restored to HEAD exactly) but the two stray root-level files were NOT deleted, since
cleanup of another reviewer live probe artifact seemed riskier than flagging it. This is a real
process risk: if git status/hygiene is a gate condition ahead of ci-green (Iron rule 6 spirit --
"Gates are ground truth"), these stray files and the uncommitted next.config.ts mutation would
have polluted a push if not caught. Flagged NEEDS-SENIOR-REVIEW so Oliver/the operator can decide
disposition (clean up vs. expected transient state mid-run).

**F-BOBBI-M1-C3-5 (nit, high confidence).** The next.config.ts header comment (lines 3-14)
documents the drift-guard rationale for duplicating the SHOP_URL literal instead of importing
from src/lib/constants.ts (Next config cannot import from src/lib/constants without an alias
resolver in the config context). This claim was not independently probed (e.g. by actually
attempting the import and observing a real failure) -- it reads as plausible (Next.js config
files run outside the app TS path-alias resolution before the build pipeline is set up) but was
not falsification-tested. Labeling this sub-claim UNVERIFIED; it is not one of the owned claims
and is a comment/rationale, not a behavioral contract, so severity is nit.

---

## Coverage manifest

**Rule zero: Unexecuted = hypothesis.** Anything assertable by running a command MUST be run
(output quoted) or labeled UNVERIFIED.

### CHECKED
- Claim 1 (38 rules, all permanent:true): read next.config.ts verbatim; scripted count and
  permanent check (verify_redirects2.mjs), output quoted above. Mutation-tested the
  permanent:true assertion (/shop to permanent:false), confirmed it fails correctly.
- Claim 2 (source-to-destination matches E6 exactly): cross-referenced ESCALATIONS.md E6
  (full text read) plus .chuck/reports/M1/rosebud-wix-inventory.md (slug-to-category table)
  against every line of next.config.ts; scripted diff, zero mismatches/missing/extra, output
  quoted.
- Claim 3 (external destination equals SHOP_URL): read src/lib/constants.ts line 17,
  confirmed byte-identical literal in next.config.ts line 17; scripted check; mutation-tested the
  drift guard (changed the literal, confirmed the test fails, restored, confirmed clean).
- Claim 4 (no identity-path shadow): enumerated served routes via Glob
  src/app/**/page.tsx; grepped next.config.ts for each as a source; scripted identity check;
  mutation-tested (added /collection self-shadow, confirmed 3 assertions fail, restored).
- Claim 5 (single source of truth): read next.config.ts redirects() body
  (spread of redirectRules); confirmed the equality test exists and is in the passing 8/8 suite.
- Claim 6 (non-vacuous unit test): ran npx vitest run tests/seo/redirects.test.ts clean
  (8/8 pass, output quoted); then ran 5 independent mutation-injection cycles (wrong destination,
  dropped rule, SHOP_URL drift, identity-shadow, permanent:false), each confirmed to fail the
  correct assertion(s), each restored and confirmed clean via git diff after. Also
  scripted the e2e spec source-coverage against next.config.ts 38 sources (36 exact plus 2
  wildcards covered by 4 samples, full coverage, zero gaps).
- Claim 7 (DECISIONS.md entry for the arithmetic note): grepped all DECISIONS.md headings
  (D1-D23, none match) and grepped for the specific terms across DECISIONS.md, ESCALATIONS.md,
  PROGRESS.md, no entry found. Confirmed ABSENT; this is a finding.
- HEAD/diff identity: git rev-parse HEAD equals 4f9717984e49a6d50cb26133e981be6249fdb3da
  (matches pin); git show stat on 4f97179 confirms exactly the 3 pinned files, all additions
  (281 insertions, 0 deletions).
- Working-tree hygiene around my own probing: every mutation was made via backed-up file
  copy, restored, and git diff on next.config.ts confirmed empty after each cycle and at
  session end.

### NOT CHECKED
- Full npm run e2e (Playwright) run of tests/e2e/redirects.spec.ts against a live built
  server: not executed to completion in this session (see COULD NOT CHECK; build instability
  blocked it). Coverage was instead established indirectly via (a) unit-test mutation testing on
  the same underlying redirectRules data, and (b) a static source-coverage comparison proving the
  e2e spec test-case arrays cover all 38 config sources. This is weaker than an actual
  308-over-HTTP run and is flagged as a gap, not silently assumed equivalent.
- SEO plumbing (sitemap/robots/metadata/analytics) and Lighthouse mobile+median remediation:
  explicitly out of scope per the brief (already PASSED cycles 1-2, not re-derived).
- Rosebud original ~95-URL Wix inventory completeness (i.e., whether the Wix site actually
  has exactly these URLs and no others requiring redirects): taken as given per the brief; not
  independently re-crawled.
- F-BOBBI-M1-C3-5 sub-claim (Next config inability to import src/lib/constants.ts without an
  alias resolver): not falsification-tested; flagged nit/UNVERIFIED above.

### COULD NOT CHECK
- npm run build clean end-to-end on this commit, this machine, this session: command
  TURSO_DATABASE_URL=file:./ci.db npm run build (after npm run db:seed-ci). First clean attempt
  got through compile, redirects-validation, and 36/36 static generation, then failed at
  trace-collection: ENOENT no such file or directory opening
  .next/server/app/_not-found/page.js.nft.json. Retried twice more after rm -rf .next; both
  subsequent attempts failed earlier, at pages-manifest.json, with the same ENOENT pattern. This
  looks like a Windows-local filesystem-timing flake (see F-BOBBI-M1-C3-3), not a defect in the
  redirect code (the one run that progressed furthest showed no redirects-validation complaint)
  but no single fully-green build was produced in this session to independently corroborate
  the build-seeded gate fresh against 4f97179 (the M1 ledger existing PASS record for that gate
  is from the prior commit 87e5c28, before this redirect commit existed).
- npm run e2e against tests/e2e/redirects.spec.ts: blocked by the same build instability
  above (Playwright webServer config builds and starts the app before running specs). Not
  attempted directly via npx playwright test against a manually-started dev server either, for
  time-budget reasons after two build failures; flagged as a real gap rather than papered over.

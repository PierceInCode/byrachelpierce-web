# Ronald-Ann — M1 silent-failure hunt (cycle 1)

> Rule zero: Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED. A silent failure I suspect but cannot reproduce is a hypothesis, not a finding.

PINS
- Repo: C:/Code/businessWebsites/byRachelPierce/byrachelpierce-web
- HEAD under gate: 87e5c2820593cce7173bac99dd60fbf69d17f6d3
- Base: 41b710d2c748471d832bba5a36e14c42c1b14518
- Diff hash: 219dd9063802dffe82056fd48b69b71721c239c7
- Probes ledger: .chuck/probes/M1-ledger.md (PROBE 1-8)

---

## VERDICT ON THE CLAIM UNDER TEST

CLAIM: Neither the teardown shim nor the retry loop can mask a genuine Lighthouse budget miss or otherwise de-gate the lighthouse gate. A real budget miss MUST still exit non-zero on BOTH attempts.

VERDICT: CONFIRMED — proven by executed probes (PROBE 4 + PROBE 5), corroborated by source reads (PROBE 1-3, 6-8). The claim holds. The lighthouse gate bites on a real budget miss and exits 1; neither masking vector can suppress it.

### The evidence chain (all executed / read at the under-gate HEAD)

1. Assert is a distinct step gated AFTER collect (PROBE 1, autorun.js). collect runs first; "if (collectStatus !== 0) process.exit(collectStatus)" (L133-134) — assert only runs when collect exits 0. Then assert runs as a separate child, "hasFailure = assertStatus !== 0" (L137-141); "if (hasFailure) process.exit(1)" (L150-153). A budget miss is decided by the SEPARATE assert child reading the saved LHR.

2. The shim only wraps kill(), which runs at teardown AFTER the LHR (with scores) is produced (PROBE 3 + PROBE 6). In chrome-launcher, destroyTmp() rmSync EPERM escapes kill() uncaught (L349 is outside kill()'s try/catch). The shim wraps the whole kill(), swallows the throw, returns undefined (matching the real void kill), and emits the substring "Chrome could not be killed". Executed against the REAL installed chrome-launcher: mod.Launcher resolves, kill is a function, the EPERM is swallowed (rethrew? false), and the escape-hatch substring matches. The shim cannot touch scores.

3. The win32 escape hatch keeps a run only when the FULL LHR was produced (PROBE 2, node-runner.js L109-117). It fires on code===1 AND win32 AND isOutputLhrLike(stdout) AND stderr has "Generating results..." AND stderr has "Chrome could not be killed". It decides whether to KEEP a fully-computed LHR — scores are in that LHR regardless of pass/fail. Assert reads those scores independently. If the audit never produced an LHR (real crash mid-audit), isOutputLhrLike is false and the run is honestly discarded.

4. A missing category fails CLOSED in assert (PROBE 7, assertions.js L15/88/140-146). Even if a preserved LHR were missing a category, the assertion result is a failure, not a silent pass. No path where "keep the LHR" converts a bad/missing score into a pass.

5. FAILURE-INJECTION (PROBE 4, EXECUTED). Drove "lhci assert" against the REAL saved audit output in .lighthouseci/ (4 URLs, run Jul 14 23:12) with a scratch config that tightened a11y minScore to 0.99 (real measured 0.95-0.96). Raw output:

    x categories.accessibility failure for minScore assertion
        expected: >=0.99
           found: 0.96
    ... (all 4 URLs) ...
    Assertion failed. Exiting with status code 1.
    === EXIT STATUS === 1

The assertion machinery — the exact codepath the gate exit depends on — exits 1 on a real budget miss.

6. RETRY IS DETERMINISTIC-MISS-SAFE (PROBE 5, EXECUTED). A harness reproducing run-lighthouse.mjs L84-98 verbatim, pointed at a fake lhci that always exits 1, ran BOTH attempts (both exit 1) and the wrapper exited 1: "HARNESS: total attempts=2, final status=1". A real budget miss is a deterministic score, so it fails both attempts; the retry cannot convert a persistent non-zero into 0.

Why failure-injection at the assert layer rather than a full autorun: a full "npm run lighthouse" seeds+builds+audits 4 URLs (several minutes) and Binkley runs the untouched gate separately. The masking vectors under suspicion are (a) the shim [wraps kill() only] and (b) the retry [wraps whole autorun]. PROBE 4 exercises the real assert exit-code path against real audit output with a forced miss; PROBE 5 exercises the exact retry loop against a persistent non-zero; PROBE 2/6 tie the shim swallow to a point strictly after scoring. Together these cover every layer at which a miss could be masked, without the multi-minute autorun.

---

## STANDARD QUIET-FAILURE HUNT (whole M1 diff)

The M1 diff is small outside package-lock.json: SEO surfaces (robots.ts, sitemap.ts, metadata/analytics + tests) plus the lighthouse gate infra.

### F1 — run-lighthouse.mjs status defaults bias to FAILURE (NOT a defect). CHECKED.
"status = result.status ?? 1" (L95), initial "let status = 1" (L85), and the launch-error branch "process.exit(1)" (L91-94) all default to non-zero. A signal-killed lhci (null status) => exit 1. No silent-success default. PROBE 8.

### F2 — resolveLhciBin() bare-lhci fallback (L37) — NOT reached in gate. CHECKED.
PROBE 8: resolves the real node_modules/.bin/lhci.cmd. Even if the fallback fired, spawnSync with shell:true resolves via PATH to the same real bin; a truly missing bin surfaces as result.error (exits 1) or non-zero status — never a false pass.

### F3 — teardown-shim.mjs outer empty catch on module-shape change (L47-50). NEEDS-SENIOR-REVIEW (LOW).
The empty outer catch swallows a require/shape failure so the shim silently no-ops. BENIGN by design: if the shim no-ops, the win32 EPERM would surface honestly and fail the run (fail-loud), and the comment says exactly that. NOT a silent de-gate — a no-op shim makes the gate MORE likely to fail, never less. Flagged only because an empty catch that swallows with no diagnostic is worth a senior glance; the failure mode it hides (shim did not attach) is self-announcing via a subsequent honest crash. Not blocking.

### F4 — sitemap.ts silent static-only output on empty DB (src/app/sitemap.ts L33-48). NEEDS-SENIOR-REVIEW (LOW / deferred to M4).
getAllPaintingSlugs() (art-service.ts L192-198) has NO try/catch: a DB error propagates and the /sitemap.xml route fails loud (500) — good. But a DB returning ZERO painting rows silently yields a static+category-only sitemap that still reports 200/success — a degraded path reporting success. The designed safety net is the M4 gate .chuck/probes/sitemap-vs-db.mjs (present; fails loud "SITEMAP-DB FAIL" when sitemap count != live DB count). At M1 this is not exercised against a live count, so the zero-rows degradation is un-gated UNTIL M4. Not an M1 defect (no M1 requirement to gate live count), but recorded so it is not lost.

### No swallowed exceptions / empty catches / quarantined tests in M1 source. CHECKED.
grep for try/catch across sitemap.ts, robots.ts, art-service.ts: none (EXIT 1 = no match). No skipped/xfail/commented-out tests introduced. New tests (seo/*, e2e/seo, mural-content.probe) assert positively and fail closed (mural probe asserts exit 1 + RED verdict).

---

## COVERAGE MANIFEST

> Unexecuted = hypothesis. Anything assertable by running a command MUST be run (output quoted) or labeled UNVERIFIED.

### CHECKED (probe + verifying output)
- Assert exits 1 on real budget miss — PROBE 4: lhci assert vs real .lighthouseci LHRs with tightened a11y=0.99 -> "Assertion failed. Exiting with status code 1." / EXIT 1.
- Retry keeps non-zero on persistent miss — PROBE 5: harness of run-lighthouse.mjs L84-98 -> both attempts exit 1, "total attempts=2, final status=1", process exit 1.
- Shim swallows only the teardown throw + emits escape-hatch string — PROBE 6: real chrome-launcher Launcher; EPERM swallowed (rethrew? false), returns undefined, stderr "ChromeLauncher Chrome could not be killed (EPERM) ...", ESCAPE-HATCH MATCH true.
- autorun sequencing collect->assert->exit1 — PROBE 1 (autorun.js L133-153, read).
- win32 escape hatch requires full LHR; only KEEPS the run — PROBE 2 (node-runner.js L109-117, read).
- destroyTmp EPERM escapes kill() uncaught — PROBE 3 (chrome-launcher.js L349 vs L331-348, read).
- missing category fails closed in assert — PROBE 7 (assertions.js L15/88/140-146, read).
- lhci bin resolves real .cmd; status defaults bias to failure — PROBE 8 (harness) + F1/F2.
- No try/catch/empty-catch/quarantined tests in M1 source — grep (EXIT 1 = no match).
- Hygiene: lighthouserc.json untouched vs HEAD; scratch confined to scratchpad — git diff --stat (empty).

### NOT CHECKED (debt, not clearance)
- Full end-to-end "npm run lighthouse" autorun with a live server + real Chrome kill race. Binkley runs the untouched gate separately; I proved the masking-vector layers instead (PROBE 4/5/6). The actual transient-EPERM-then-shim-rescue path in a live child was not observed firing in situ — only the swallow logic (PROBE 6) and the escape-hatch conditions (PROBE 2) were verified. The real audit already succeeded once (the LHRs dated Jul 14 23:12 used in PROBE 4 exist), so a passing live run is corroborated, but I did not re-run it.
- lighthouse:prod variant (collect.startServerCommand= + prod URLs) — argv passthrough read (run-lighthouse.mjs L74-75) but not executed against the live prod site (out of scope / would hit production).
- @vercel/analytics runtime behavior — the layout renders Analytics; the analytics test mocks it. Whether telemetry silently no-ops in prod is a runtime concern, not a diff-level silent failure; not probed.
- M4 sitemap-vs-db live-count gate — probe file exists but is an M4 gate; the zero-rows degradation (F4) is un-gated at M1 by design.

### COULD NOT CHECK (command + error)
- None. Every command I attempted ran; no probe was blocked by a failed command.

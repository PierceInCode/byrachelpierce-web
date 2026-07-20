# Otis — M1 post-merge close (byrachelpierce-web)

Branch: chuck/M2 (post-merge bookkeeping, mirrors M0->M1 commit 41b710d).
Otis does NOT edit BUDGET.md or commit; this is the return for Milquetoast to transcribe.

## 1. Deterministic actuals (bin/usage.sh, chuck 1.3.0)

Scope decision — M1 = SEO/redirects milestone sessions AFTER the M0 close.
Timestamps in transcripts are UTC; git commit times are -0400 local.
- M0 close/bookkeeping commit 41b710d = 2026-07-14 22:22 local = 2026-07-15 02:22 UTC.
- Session 60e01c64 ran 2026-07-14T19:57 -> 2026-07-15T02:26 UTC (= 15:57 -> 22:26 local):
  it ran the M0 gate cycles AND the M0 close -> counted in the M0 row, EXCLUDED from M1.
- Session cc8dcd05 (2026-07-20) is THIS M2 bookkeeping session -> EXCLUDED.
- M1 sessions counted (each with its subagent sidecar dir, same method as M0 row):
    eae6202e  2026-07-15T02:31->04:12 UTC  SEO/sitemap/robots/metadata/analytics/Lighthouse
    d2b56347  2026-07-17T19:15->19:20 UTC  M1 mid-milestone
    cae076c8  2026-07-19T21:53->2026-07-20T00:33 UTC  Wix->Vercel redirect map + M1 close

Per-session verbatim:
    eae6202e: usage: input=207334 output=795604 cache_read=191918993 cache_create=3921906 total=1002938 files=12 lines=3188 malformed=0
    d2b56347: usage: input=198125 output=91983 cache_read=3469737 cache_create=589676 total=290108 files=2 lines=160 malformed=0
    cae076c8: usage: input=353681 output=964721 cache_read=107899468 cache_create=4128066 total=1318402 files=15 lines=2308 malformed=0

M1 AGGREGATE (verbatim, source of truth):
    usage: input=759140 output=1852308 cache_read=303288198 cache_create=8639648 total=2611448 files=29 lines=5656 malformed=0

malformed=0 -> clean count, no caveat.

## 2. Calibration ledger (bin/calibration.sh, ~/.claude/chuck/calibration.jsonl)

Appended M1 line (remediation_cycles=1: gate artifact M1.json 8/8 PASS; one fix(m1) commit
ad97e84 for Lighthouse mobile after the feature commit):
    calibration APPENDED: byrachelpierce-web M1
Re-derive after append (verbatim):
    calib: lines=12 malformed=0 projects=4 cache_factor_median=5.7 remediation_rate=2.00 io_per_milestone_median=1833119
Priors before append (verbatim):
    calib: lines=11 malformed=0 projects=4 cache_factor_median=5.7 remediation_rate=2.09 io_per_milestone_median=1797982

## 3. Ledger row (for BUDGET.md, newest-first, Milquetoast writes it)

| 2026-07-20 | M1 | 2,611,448 in/out tokens (input=759,140; output=1,852,308; cache_read=303,288,198; cache_create=8,639,648) | 4.5M-11.0M | 11,862,876 | UNDER band (2.61M vs 4.5M low, ~42% below low end) - M1 passed 8/8 gates with 1 remediation cycle (Lighthouse mobile) vs M0's 4 cycles; subscription-only (opus/sonnet), NO Fable -> informational raw counts, NOT dollar-converted, does NOT trip the cash overrun escalation. cash exposure: $0 |

Cumulative math: 9,251,428 (M0 row) + 2,611,448 (M1) = 11,862,876.

## 4. Overrun check (cash only)

NO escalation. Zero Fable at build time -> $0 cash exposure -> the threshold (200% = fires at
3x band high = 33.0M) is moot by construction. M1 is subscription opus/sonnet raw counts,
informational. Additionally M1 came in UNDER its band, so even the (non-cash) band is not
exceeded.

## 5. Forward band re-baseline (M2 / M3 / M4)

New evidence: the one real code milestone to date that ran normally (M1, code-only against
existing pages) cost 2.61M in/out with 1 remediation cycle - BELOW its 4.5M-11.0M band. M0's
7.52M was inflated by 4 gate cycles; M1 confirms remediation cycles are variance driver #1 and
that a clean-ish milestone lands low. io_per_milestone_median across the ledger is ~1.83M.

- M2  KEEP 1.0M-3.0M. Human-hands content loop; agent side = probes + verification + gate wave
  only. M1's multi-wave gate cost (~1.3M in the close session alone) sits inside this band; no
  code work to push it up. M1 evidence supports the band as-is.
- M3  LOWER 7.0M-18.0M -> 5.0M-14.0M. M3 was set at ~1.6-1.7x M1's band by reasoning, not
  history (D16). Now that M1 has ACTUAL history (2.61M) far below its own band, the multiplier
  should ride on M1's actual, not M1's inflated estimate. Applying ~1.7-2.0x to M1's realized
  cost plus headroom for the auth seam / migration / 5 mutation surfaces / e2e infra + likely
  2-3 remediation cycles -> 5.0M-14.0M. Still the largest milestone; band stays wide on purpose.
- M4  LOWER 2.5M-7.0M -> 2.0M-5.5M. Go-live is operator-heavy; agent side is probes + final
  sweeps + ship report + Gate 2. M1's realized close-wave cost (~1.3M) is the best analog for
  M4's gate/probe-heavy shape; the M0-era 2.5M-7.0M was set before any code-milestone actual
  existed. Trim toward observed gate-wave cost with remediation headroom.

Note: these are subscription-tier token bands (informational), NOT cash. No cash band exists
(planning tier was NOT Fable per the run's routing; $0 cash exposure end to end).

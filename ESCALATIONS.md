# Escalations — byrachelpierce-web takeover

**Escalations are the ONLY mid-run operator interruptions.** Between Gate 1 (plan veto) and Gate 2 (ship), Chuck runs autonomously; nothing else pulls you back in except a checkpoint pause you chose. When an escalation fires, the run stops cleanly and no further work begins until your answer is recorded in the entry's `**Answer:**` line; answering is how you resume (`/chuck:run`).

Entry types (exactly one per entry): `core-bet-failure` | `gate-3-strikes` | `irreversible-op` | `budget-overrun` | `human-hands` | `spec-amendment`.

Likely candidates this run, so none surprises you: `human-hands` (HT1 rotation, HT2 content loop with Rachel, HT4 admin QC with Laciey, HT3 cutover smoke), `irreversible-op` (anything touching production data, including the M3 migration ritual), and `blocked-gate`-style `gate-3-strikes` if Lighthouse budgets or the M3 auth seam resist remediation.

_The log below is empty by design; the run appends entries at the moment of escalation._

---

## E1 — budget-overrun — 2026-07-07 — planning phase

**Type:** `budget-overrun`

**What happened:** Otis's deterministic count (`bin/usage.sh`, 9 transcript files, verbatim: `usage: input=367069 output=865784 cache_read=69454934 cache_create=5008396 total=1232853 files=9 lines=1822 malformed=0`) puts the plan-refutation sessions of 2026-07-07 at 1,232,853 in/out tokens. Cumulative planning-phase actuals are **1,730,577** against the planning band of 0.3M–0.8M — ≈116% over the high end, past the `threshold: 50%` line in BUDGET.md. The threshold trigger fires regardless of run mode.

**Why it happened (context, not excuse):** planning was estimated as one session; it became three — the original package authoring, a reboot-killed refutation dispatch, and today's full re-dispatch (a fresh max-effort Snorklewacker over the whole package plus 13-finding remediation and re-validation). The refutation content was not wasted — it produced D15 and four new gates — but the band did not price a redo.

**Decision needed (pick one, or write your own):**

- (a) **Accept as sunk** — planning spend is done and cannot be un-spent; keep the M0–M3 bands as written (they priced milestone work, not planning, and are unaffected by this overrun). Otis re-baselines at each checkpoint as normal. _(Recommended: the overrun is confined to the planning phase; no forward band is invalidated by it.)_
- (b) Accept AND widen the M0–M3 bands by a stated factor if you now distrust the estimating.
- (c) Cut scope before approving the plan.

**Answer:**
Accept and widen bands to allow for 200% overage.
---

## E2 — human-hands — 2026-07-07 — M0 secret rotation (HT1)

**Type:** `human-hands`

**What happened:** M0's machine work is COMPLETE on chuck/M0 @ 102a0b9. Gates already executed green this session (quote): check/coverage/build-seeded/e2e green via Bill (coverage 90.36% lines / 97.67% funcs; build 34/34; e2e 12 passed); dep-audit exit 0 AFTER drizzle-orm 0.45.2 CVE bump (was red: GHSA-gpj5-g38j-94v9 HIGH); eol-clean "EOL OK"; push-guard "PUSH-GUARD OK"; restore-roundtrip 3/3; prod-verify "PROD-VERIFY OK" (528 paintings, 0 sentinels, 4 migrations); alias-smoke "SMOKE OK" (4/4 routes 200); tag-r4 (R4 @ 2c9f15e pushed). Pending: ci-green on 102a0b9 (running, PR #13 draft), rotation-recorded (THIS escalation), then Binkley's full gate.

The operator action: run protocol `.chuck/human-tests/HT1-secret-rotation.md` (rotate the leaked Resend key + Turso token, update .env.local, confirm dev + magic-link, delete Database Token.txt if present, confirm art backup 0.6 + Vercel previews 0.7), save the filled form at `.chuck/human-tests/HT1-result.md`, resume with /chuck:run. Rotation is contractually not deferrable again (D11).

RIDER 1 (operator approval requested in your Answer): remote-branch deletion list per audit §2/F11 — merged-and-stale: r3-collection, r4-content, docs/r3-close-out, docs/r4-close-out, final-product-planning; closed-unmerged: vercel/react-server-components-cve-vu-y3bp7s. Approve deletion (all/some/none) in the Answer; deletion happens after your answer.

RIDER 2 (operator one-liner, F15): in docs/SITE-ARCHITECTURE-v2.md §5.2 list item 3 (line 171), fix Lilly->Lily (both occurrences on the line) — agents cannot edit docs/.

Answer format suggestion: "HT1 returned at <path>; branches: <decision>; F15: done/deferred".

**Answer:**

---

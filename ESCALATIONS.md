# Escalations — byrachelpierce-web takeover

**Escalations are the ONLY mid-run operator interruptions.** Between Gate 1 (plan veto) and Gate 2 (ship), Chuck runs autonomously; nothing else pulls you back in except a checkpoint pause you chose. When an escalation fires, the run stops cleanly and no further work begins until your answer is recorded in the entry's `**Answer:**` line; answering is how you resume (`/chuck:run`).

Entry types (exactly one per entry): `core-bet-failure` | `gate-3-strikes` | `irreversible-op` | `budget-overrun` | `human-hands` | `spec-amendment`.

Likely candidates this run, so none surprises you: `human-hands` (HT1 rotation, HT2 content loop with Rachel, HT3 cutover smoke), `irreversible-op` (anything touching production data), and `blocked-gate`-style `gate-3-strikes` if Lighthouse budgets resist remediation.

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

---

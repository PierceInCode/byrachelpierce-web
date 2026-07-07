# Escalations — byrachelpierce-web takeover

**Escalations are the ONLY mid-run operator interruptions.** Between Gate 1 (plan veto) and Gate 2 (ship), Chuck runs autonomously; nothing else pulls you back in except a checkpoint pause you chose. When an escalation fires, the run stops cleanly and no further work begins until your answer is recorded in the entry's `**Answer:**` line; answering is how you resume (`/chuck:run`).

Entry types (exactly one per entry): `core-bet-failure` | `gate-3-strikes` | `irreversible-op` | `budget-overrun` | `human-hands` | `spec-amendment`.

Likely candidates this run, so none surprises you: `human-hands` (HT1 rotation, HT2 content loop with Rachel, HT3 cutover smoke), `irreversible-op` (anything touching production data), and `blocked-gate`-style `gate-3-strikes` if Lighthouse budgets resist remediation.

_The log below is empty by design; the run appends entries at the moment of escalation._

---

# Budget — byrachelpierce-web takeover (finish R5, ship v1.0.0)

_Otis's ledger. Estimates are ranges, not promises. Counts come from the deterministic script (`bin/usage.sh` over session transcripts), never eyeballed. Read at Gate 1 alongside DECISIONS.md and BUILD-SPEC.md; re-baselined at every checkpoint._

## Assumptions

- **Unit:** input+output tokens per the usage script's `total` field (cache reads/writes are reported for transparency but excluded from the bands — they are plan-limit-relevant but rate-discounted). Planning measured 27.2M cache-read tokens against 0.50M in/out — expect a similar ~50× cache-read multiplier on milestone sessions.
- **Model mix:** orchestration on the operator's session model; Oliver/Binkley-wave dispatches on sonnet/opus per the routing doctrine (haiku is denied by the routing hook — measured fact, this session). Planning itself ran on a Fable-class session.
- **Variance driver #1 is remediation cycles:** a milestone that passes its gates first try lands near the low end; three remediation cycles lands near the high end. M2's band is narrow because the work is human-hands (agent side is verification only); its calendar time is unbounded but its token cost is small.
- **Blow-the-estimate risks:** a `spec-amendment` mid-run (re-plan cost), production state diverging from the audit at M0's `prod-verify` gate (investigation cost), Lighthouse budgets resisting remediation in M1, or the M3 auth seam (Auth.js pinned beta + session-cookie e2e seam) fighting back.
- **M3 band basis (added 2026-07-07 with D16):** estimated at 1.6–1.7× M1's band — M1 is code-only against existing pages; M3 adds a migration, an authz layer, five mutation surfaces, an upload path, and new e2e infrastructure. No comparable milestone has run yet in this project; the band is reasoning, not history — flagged for re-baseline at the M0 and M1 checkpoints.
- **Cash:** existing accounts only; the run itself commits no spend beyond plan/API usage.

## Rates table (version 2026-07-06)

| Model tier                      | Input rate | Output rate | Notes                                                                                    |
| ------------------------------- | ---------- | ----------- | ---------------------------------------------------------------------------------------- |
| Fable 5 (session/orchestration) | UNVERIFIED | UNVERIFIED  | No public list rate verified this session; bands therefore quoted in tokens, not dollars |
| Opus 4.8 (dispatch)             | $5/MTok    | $25/MTok    | From training knowledge — verify before converting to dollars                            |
| Sonnet 5 (dispatch)             | $3/MTok    | $15/MTok    | From training knowledge — verify before converting to dollars                            |

On a subscription plan these read as API-equivalent value against plan limits, not dollars billed. Because the Fable rate is unverified, **the budget is denominated in tokens**; the threshold below triggers on token actuals vs token bands.

## Per-milestone estimate

| Milestone | Estimate (low–high) | Notes                                                                                                                                                                                                                                                                                                  |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0        | 0.4M–1.2M tokens    | Small code items (backup script, push guard, renorm) but many gates + the Closet wave; high end if renormalization or prod re-verification fights back                                                                                                                                                 |
| M1        | 4.5M–11.0M tokens   | Re-baselined at M0 (2026-07-14) from 0.6M–1.8M: M0 landed at 7.52M in/out (4 gate cycles + closing pass) vs a 0.4M–1.2M estimate. The real code milestone (sitemap/robots/metadata/redirects/LHCI); high end driven by Lighthouse remediation cycles                                                   |
| M2        | 1.0M–3.0M tokens    | Re-baselined at M0 (2026-07-14) from 0.15M–0.5M. Human-hands long pole; agent side is probes, verification, suite re-runs, and the gate wave only — small vs code milestones but multi-wave gates at M0-observed cost                                                                                  |
| M3        | 7.0M–18.0M tokens   | Re-baselined at M0 (2026-07-14) from 1.0M–3.0M. Admin panel (added at Gate 1, D16/D17) — the largest code milestone: migration, authz, CRUD server actions + forms, upload path, JPEG parser, e2e seam + journeys; high end driven by remediation cycles on the auth seam and archived-exclusion sweep |
| M4        | 2.5M–7.0M tokens    | Re-baselined at M0 (2026-07-14) from 0.35M–1.0M. Go-live (was M3 pre-D16); operator-heavy; agent side is probes (incl. sitemap-vs-db, admin-lockout re-run), final sweeps, ship report (Milo) + Gate 2 assembly                                                                                        |

threshold: 200%

_Threshold history: originally 50%; raised to 200% by the operator's E1 answer (2026-07-07, "Accept and widen bands to allow for 200% overage"). Implemented as the overrun-allowance threshold against the UNCHANGED estimate bands above — the bands remain Otis's honest estimates; the allowance is what moved. The next `budget-overrun` escalation fires when a milestone's cumulative actuals exceed its band's high end by 200% (i.e., 3× the high end). Planning's overage (1,730,577 vs 0.8M high end, ≈116% over) is accepted as sunk under this allowance._

## Ledger

| Date       | Milestone             | Actual                                                                                                         | Est. band | Cumulative | Variance vs. est.                                                                                                                                                                                                           |
| ---------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-14 | M0                    | 7,520,851 in/out tokens (input=2,551,101; output=4,969,750; cache_read=1,015,439,959; cache_create=37,583,297) | 0.4M–1.2M | 9,251,428  | over band — 4 gate cycles (1 initial + 3 re-gates) + closing pass; subscription-only (opus/sonnet), NO Fable → informational raw counts, NOT dollar-converted, does NOT trip the cash overrun escalation. cash exposure: $0 |
| 2026-07-06 | planning              | 497,724 in/out tokens (input=118,393; output=379,331; cache_read=27,173,549; cache_create=1,191,070)           | 0.3M–0.8M | 497,724    | in band                                                                                                                                                                                                                     |
| 2026-07-07 | planning (refutation) | 1,232,853 in/out tokens (input=367,069; output=865,784; cache_read=69,454,934; cache_create=5,008,396)         | 0.3M–0.8M | 1,730,577  | over band — crossed then-50% threshold; E1 answered: accepted, allowance now 200%                                                                                                                                           |

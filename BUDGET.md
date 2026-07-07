# Budget — byrachelpierce-web takeover (finish R5, ship v1.0.0)

_Otis's ledger. Estimates are ranges, not promises. Counts come from the deterministic script (`bin/usage.sh` over session transcripts), never eyeballed. Read at Gate 1 alongside DECISIONS.md and BUILD-SPEC.md; re-baselined at every checkpoint._

## Assumptions

- **Unit:** input+output tokens per the usage script's `total` field (cache reads/writes are reported for transparency but excluded from the bands — they are plan-limit-relevant but rate-discounted). Planning measured 27.2M cache-read tokens against 0.50M in/out — expect a similar ~50× cache-read multiplier on milestone sessions.
- **Model mix:** orchestration on the operator's session model; Oliver/Binkley-wave dispatches on sonnet/opus per the routing doctrine (haiku is denied by the routing hook — measured fact, this session). Planning itself ran on a Fable-class session.
- **Variance driver #1 is remediation cycles:** a milestone that passes its gates first try lands near the low end; three remediation cycles lands near the high end. M2's band is narrow because the work is human-hands (agent side is verification only); its calendar time is unbounded but its token cost is small.
- **Blow-the-estimate risks:** a `spec-amendment` mid-run (re-plan cost), production state diverging from the audit at M0's `prod-verify` gate (investigation cost), or Lighthouse budgets resisting remediation in M1.
- **Cash:** existing accounts only; the run itself commits no spend beyond plan/API usage.

## Rates table (version 2026-07-06)

| Model tier                      | Input rate | Output rate | Notes                                                                                    |
| ------------------------------- | ---------- | ----------- | ---------------------------------------------------------------------------------------- |
| Fable 5 (session/orchestration) | UNVERIFIED | UNVERIFIED  | No public list rate verified this session; bands therefore quoted in tokens, not dollars |
| Opus 4.8 (dispatch)             | $5/MTok    | $25/MTok    | From training knowledge — verify before converting to dollars                            |
| Sonnet 5 (dispatch)             | $3/MTok    | $15/MTok    | From training knowledge — verify before converting to dollars                            |

On a subscription plan these read as API-equivalent value against plan limits, not dollars billed. Because the Fable rate is unverified, **the budget is denominated in tokens**; the threshold below triggers on token actuals vs token bands.

## Per-milestone estimate

| Milestone | Estimate (low–high) | Notes                                                                                                                                                  |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0        | 0.4M–1.2M tokens    | Small code items (backup script, push guard, renorm) but many gates + the Closet wave; high end if renormalization or prod re-verification fights back |
| M1        | 0.6M–1.8M tokens    | The real code milestone (sitemap/robots/metadata/redirects/LHCI); high end driven by Lighthouse remediation cycles                                     |
| M2        | 0.15M–0.5M tokens   | Human-hands long pole; agent side is probes, verification, suite re-runs, and the gate wave only                                                       |
| M3        | 0.3M–0.9M tokens    | Operator-heavy; agent side is probes, final sweeps, ship report (Milo) + Gate 2 assembly                                                               |

threshold: 50%

## Ledger

| Date       | Milestone | Actual                                                                                               | Est. band | Cumulative | Variance vs. est. |
| ---------- | --------- | ---------------------------------------------------------------------------------------------------- | --------- | ---------- | ----------------- |
| 2026-07-06 | planning  | 497,724 in/out tokens (input=118,393; output=379,331; cache_read=27,173,549; cache_create=1,191,070) | 0.3M–0.8M | 497,724    | in band           |

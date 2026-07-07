# Change request CR1 — byrachelpierce-web

_The `/chuck:change` form. Mid-run scope changes never happen by editing the approved spec docs — those are write-protected once `.chuck/plan-approved` exists. They happen here: capture the request, re-plan the delta, re-estimate the delta, and pass a mini-veto. Only after approval does the change enter `BUILD-SPEC.md` and append to the DECISIONS.md Amendments section._

## Request

Operator, in-session 2026-07-07 (verbatim): "Delete this issue from your records and to-do items. I seriously don't care." — referring to the leaked-credential rotation obligation (E2 / HT1), after establishing the leak was never on the public GitHub repo (sweep-verified) and the known exposure is local files + retained conversation history. Formalized as: **drop the secret-rotation obligation entirely (HT1 protocol + `rotation-recorded` gate); the Resend account/key survives only as an M3 functional prerequisite; the Turso token rotation is waived.**

## Affected milestones

- **M0 — gates changed, work items reduced.** `rotation-recorded` gate removed; HT1 (work item 9) retired; DoD reworded. This UNBLOCKS M0's close: every remaining gate is already green or pending only CI + Binkley.
- **M3 — one work item clarified (no gate change).** Operator item 7 now explicitly includes creating the NEW dedicated ByRachelPierce Resend account + API key (the old key is already deleted; without a working key, magic-link login — including all three admin logins — cannot function). This was already recorded in the E2 addendum; the amendment makes it spec text.
- **M4 — wording + ship-report riders (no gate change).** Env-checklist wording "M0-rotated secrets" → current secrets (Resend key from the M3 account; Turso token unchanged, waived). The two non-rotation HT1 confirmations (art-folder backup 0.6, Vercel previews 0.7) and the standing Turso waiver move to Milo's ship-report checklist at Gate 2 — listed, not gated.
- **NOT affected:** M1, M2 — untouched. No past-green milestone reopened (none is green yet).

## Delta plan

1. `.chuck/gates.json` M0: delete the `rotation-recorded` gate object. Remaining M0 gates (12) unchanged and machine-runnable as written.
2. `BUILD-SPEC.md` M0 (amendment flow): work item 9 marked retired by Amendment A1; escalation trigger "HT1 not returned → human-hands" removed; DoD clause "secrets are rotated (HT1 all-Pass)" → "the secret-rotation obligation is waived by the operator (Amendment A1; E2 answer). The Resend replacement is an M3 functional prerequisite; the Turso production token continues in use unrotated by explicit operator decision."
3. `BUILD-SPEC.md` M3 item 7 (amendment flow): prepend "create the NEW dedicated ByRachelPierce Resend account and API key (the prior key is deleted — magic-link auth is non-functional until this lands), then" before the domain-verification step.
4. `BUILD-SPEC.md` M4 (amendment flow): item 2 wording per above; add to item 6 (Milo/ship report): "carry the A1 waiver + the unconfirmed Phase-0.6 art-backup and 0.7 preview confirmations as explicit ship-report checklist lines."
5. `ESCALATIONS.md` E2 `**Answer:**` transcribed (attributed to the in-session operator instruction): rotation waived per A1; HT1 will not be returned; riders NOT resolved by this answer — RIDER 1 (remote-branch deletions) and RIDER 2 (F15 `Lilly`→`Lily` docs one-liner) stay open, carried to the next operator touchpoint as non-blocking items.
6. DECISIONS.md `## Amendments` append (shell append — the sanctioned path past the freeze hook): **A1** recording all of the above with the risk statement, one sentence, no relitigating: the leaked Turso token remains valid indefinitely; anyone holding a copy retains full read/write on the production DB; known exposure is local-machine files and retained AI-conversation history, not any indexed/public location (sweep-verified).
7. Milquetoast: PROGRESS board/history + session-state updated; HT1-secret-rotation.md left in place with a "RETIRED by A1" header line (nothing deleted — append-only ledgers).

## Delta budget

Otis-discipline statement (null delta): **no band changes.** M0 remains 0.4M–1.2M (this change removes a human wait, not agent work; the amendment mechanics cost <0.05M). Projection to completion unchanged: M0–M4 ≈ 2.45M–7.4M tokens against the 200% allowance; this delta alone cannot cross the threshold. Actuals counted as normal at M0 close.

## Mini-veto

**Operator approval:** {{APPROVED_DATE}}
_(ISO date the operator approved this change — blank means unapproved, and the change does not proceed. On approval, the change enters BUILD-SPEC via the amendment flow: it appends to the DECISIONS.md Amendments section, the affected milestones and their gates are updated, and Otis re-baselines the remainder.)_

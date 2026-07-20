# Human-hands test protocol HT1 — secret rotation + Phase-0 confirmations

> **RETIRED / COMPLETED 2026-07-14 by Amendment A1 (DECISIONS D18).** The operator rotated both leaked credentials (Resend key + Turso production token), deleted `Database Token.txt`, and confirmed the `public/art/` backup. The magic-link send-test (step 4) and the Vercel-preview confirmation (step 7) were not performed in-session and are carried to M3 and the ship-report respectively. The `rotation-recorded` gate is removed from `gates.json`; this protocol is kept for the record and is not re-run.

**Milestone:** M0 — Takeover baseline
**What this proves:** the two leaked credentials (legacy DECISIONS 003/013) are dead, the replacements work, and the two open Phase-0 confirmations (art backup, Vercel previews) are settled. Gate `rotation-recorded` reads your result form.
**You will need:** Resend dashboard login, Turso dashboard login, Vercel dashboard login, this machine.

## Protocol

1. Resend dashboard → API Keys → revoke the key beginning `re_cQuXwBZ1` → create a new key — expected: old key shows revoked; new key created. **NOTE (see ESCALATIONS E2 addendum):** the `re_cQuXwBZ1` key is already deleted, and the DEDICATED byrachelpierce.com account is blocked until the Wix cutover (Resend↔Wix domain incompatibility). Interim path to decide next session: create a key under an INTERIM non-byrachelpierce.com Resend account and put it in `.env.local`'s active lines; the real dedicated account + byrachelpierce.com verification come at M4, swapped in as a key-only change.
2. Turso dashboard → the `byrachelpierce` database → revoke the auth token that was in `Database Token.txt` (rotate if you cannot identify it individually) → create a new token — expected: a new token exists; the old one is invalid.
3. Update `.env.local`: new Resend key in the active lines; new Turso token in the commented production block. Do NOT commit this file — expected: `git status` does not list `.env.local`.
4. Run `npm run dev` and send yourself a trail magic link — expected: email arrives (test domain delivers to your own address only — that is normal until the M3 domain verification).
5. Check `C:\Code\businessWebsites\byRachelPierce\Database Token.txt` — expected: file does not exist; delete it if it does.
6. Confirm `public/art/` (205MB) is backed up outside this repo (external drive or cloud) — record WHERE in Notes. This is Phase 0.6.
7. Vercel dashboard → project → confirm PRs produce preview deployments — expected: the most recent PR shows a preview URL. This is Phase 0.7.

## Result form

| Step | Observed | Pass/Fail | Notes |
| ---- | -------- | --------- | ----- |
| 1    |          |           |       |
| 2    |          |           |       |
| 3    |          |           |       |
| 4    |          |           |       |
| 5    |          |           |       |
| 6    |          |           |       |
| 7    |          |           |       |

## Return instructions

1. Save this file with the form filled in at `.chuck/human-tests/HT1-result.md`.
2. Resume with `/chuck:run`. All-Pass clears the escalation; any Fail becomes a blocked-gate with your notes attached.

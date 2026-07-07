# Human-hands test protocol HT3 — DNS cutover + go-live smoke matrix

**Milestone:** M3 — Go-live
**What this proves:** `byrachelpierce.com` serves this site from Vercel with everything a visitor touches working — the legacy Spec §10.2 smoke matrix, executed and recorded. Gates `domain-live`, `lighthouse-prod`, and `smoke-matrix-recorded` verify the machine-checkable parts.
**You will need:** DNS host login, Vercel + Resend dashboards, a phone with a NON-owner email inbox, a desktop. Read `OPERATOR-GUIDE.md` §R5 end-to-end first. **Rollback at any point:** repoint apex + www at the old Wix records (TTL is 300, ≤5 min); Wix keeps running until you cancel it — don't cancel until a week of green.

## Protocol

1. Day before: at the DNS host, lower TTL on apex + www to 300 — expected: TTL shows 300.
2. Verify Vercel production env vars per BUILD-SPEC M3 item 1 (rotated secrets from HT1, `NEXTAUTH_URL=https://byrachelpierce.com`, verified-domain `EMAIL_FROM`, real `GALLERY_EMAIL`) and that the latest production deploy is green — expected: all set; deploy green.
3. Resend: verify `byrachelpierce.com` (add SPF + DKIM records at the DNS host) — expected: Resend shows the domain verified.
4. Cutover: point apex + www at Vercel (dashboard gives exact records); wait for cert issuance — expected: `https://byrachelpierce.com` loads with a valid cert.
5. Every nav item loads over `https://byrachelpierce.com` on phone AND desktop — expected: all 200, no mixed-content warnings.
6. `www.byrachelpierce.com` — expected: redirects to the apex.
7. Collection: filter, search, paginate — expected: results actually change.
8. One painting page — expected: image renders (from Blob) with correct availability text.
9. Trail on a phone: magic-link round trip **to an inbox that is NOT your Resend account email** — expected: mail arrives from the verified domain; sign-in works.
10. Complete a real check-in — expected: gallery email arrives at `GALLERY_EMAIL` with real mural names + timestamps.
11. Spot-check 3 old Wix URLs — expected: each 308-redirects to the mapped page.
12. Date and initial this form.

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
| 8    |          |           |       |
| 9    |          |           |       |
| 10   |          |           |       |
| 11   |          |           |       |
| 12   |          |           |       |

## Return instructions

1. Save this file with the form filled in at `.chuck/human-tests/HT3-result.md`.
2. Resume with `/chuck:run`. All-Pass lifts the gate and M3 proceeds to `v1.0.0` + the ship report; any Fail becomes a blocked-gate — include whether you rolled DNS back in Notes.

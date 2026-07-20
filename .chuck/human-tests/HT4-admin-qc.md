# Human-hands test protocol HT4 — admin panel acceptance + ops-manager QC

**Milestone:** M4 — Go-live (this protocol gates the cutover; the panel itself shipped in M3)
**What this proves:** the admin panel works for the real humans it was built for (Matthew, Rachel, Laciey — Architecture v1 §11), every CRUD path was exercised against real production data by an admin, and the ops manager has QC'd the collection and calls it launch-ready. Machine gates (`admin-schema`, `admin-lockout`, e2e journeys) proved the mechanics; **this form is the human attestation no probe can give.**
**You will need:** Laciey (ops manager), phones and/or desktops for each admin, one genuinely duplicate painting to archive (or a willingness to archive-then-restore), one new painting's pre-processed images (web JPEG ≤ 600 KB + thumb JPEG ≤ 200 KB from the Photoshop pipeline). All steps run against the deployed alias `https://byrachelpierce-web.vercel.app` — BEFORE any DNS step.

## Protocol

1. Matthew signs in via magic link (matthew@byrachelpierce.com) and reaches `/admin` — expected: email arrives, list of paintings loads.
2. Rachel signs in via magic link and reaches `/admin` — expected: same.
3. Laciey signs in via magic link and reaches `/admin` — expected: same.
4. Lockout check: open `/admin` in a private/incognito window (signed out) — expected: 404 page, no panel content.
5. Edit: change one painting's title from the panel; open its public page — expected: new title visible within 60 seconds; then set it to the correct final value.
6. Tags: attach one tag and detach one tag on a painting; check the collection filter for that tag — expected: filter results reflect the change.
7. Archive: archive a duplicate painting — expected: it disappears from `/collection` and from `/sitemap.xml`, its public URL 404s, and it still shows (as archived) in `/admin`.
8. Restore: restore an archived painting (the step-7 one, unless it is a genuine duplicate you want gone — note which) — expected: it returns to `/collection` and the sitemap.
9. Create: add one real painting through the panel — upload the pre-processed web + thumb JPEGs, fill title, Description (the panel stores it in the `notes` field), tags, and dimensions-in-inches (blank if unknown — never guessed) — expected: the new public page renders with the image served from Blob and the description text visible.
10. QC sign-off (Laciey): sweep the full `/admin` list for data errors (titles, availability, obvious duplicates); fix what the panel can fix; note anything it cannot — expected: Laciey states the collection is launch-ready, or the Notes column says exactly what blocks it.

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

## Return instructions

1. Save this file with the form filled in at `.chuck/human-tests/HT4-result.md`.
2. Resume with `/chuck:run`. All-Pass clears the gate; any Fail becomes a blocked-gate with your notes attached. The DNS cutover (HT3) does not start until this form is all-Pass.

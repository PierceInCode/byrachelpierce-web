# Human-hands test protocol HT2 — the content loop with Rachel

**Milestone:** M2 — Content loop completion
**What this proves:** all 14 murals carry Rachel's REAL titles/descriptions/years on production (Invariant 4 — the trail may not go live with placeholder fiction), applied through the backup-first ritual. Gates `mural-content`, `backup-before-apply`, `ingest-report`, and `content-loop-recorded` verify the machine-checkable parts; **step 8 is your attestation that the content is real** — the one thing no probe can check.
**You will need:** Rachel (content), this machine, production creds in `.env.local` (uncommented only for steps 3–6, re-commented after).

## Protocol

1. With Rachel, fill `docs/intake/murals.csv` — all 14 rows: `real_name`, `description` (1–2 sentences, her voice), `year_painted` (blank if unknown — never guessed) — expected: 14 complete rows.
2. Run `npx tsx scripts/export-catalog-csv.ts` with production creds active (read-only) and fill `docs/intake/paintings.csv` as far as records allow — expected: pre-filled 528-row sheet; blank cells mean "no change".
3. Backup: `npx tsx scripts/backup-prod.ts` — expected: one `<table>-YYYY-MM-DD.json` per app table appears in `backups/`, each parsing as a JSON array, paintings with all 528 rows. (`node .chuck/probes/backup-check.mjs` enforces exactly this at the gate — row counts are the bar, not "looks non-trivial".)
4. Dry run: `npx tsx scripts/ingest-content.ts --dry-run` → read the whole report — expected: 14 mural rows planned, ZERO unresolved mural errors (painting size-parse errors are fine — those fields stay unwritten).
5. Apply: `npx tsx scripts/ingest-content.ts --apply` — expected: report matches the dry-run plan.
6. Re-comment the production creds in `.env.local` — expected: active `TURSO_DATABASE_URL` is `file:./dev.db` again.
7. Commit the regenerated `src/lib/mural-data.ts`, `docs/intake/murals.csv`, and `docs/intake/ingest-report-*.md` via PR; merge on green CI — expected: production deploy goes green.
8. Open `https://byrachelpierce-web.vercel.app/murals/trail` (or the live domain if M3 already cut over) with Rachel — expected: **she confirms every one of the 14 names/descriptions is hers and true.** Also spot-check 5 paintings against the CSV (size, availability).

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

## Return instructions

1. Save this file with the form filled in at `.chuck/human-tests/HT2-result.md`.
2. Resume with `/chuck:run`. All-Pass clears the escalation; any Fail becomes a blocked-gate with your notes attached.

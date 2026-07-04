# PROGRESS — byrachelpierce-web

> The agent updates this at the end of EVERY session. The operator verifies it before /clear.

## Milestone status (plan: `docs/FINAL-BUILD-SPEC.md`)

- [ ] **Phase 0** (operator) — unblocked per DECISIONS 013 (0.1 and 0.2 deferred/substituted, not gating).
  - [x] planning PR merged + `planning-docs` tag
  - [x] harness verified (`test-runner`, `spec-auditor`, `vercel-analyst` agents + hooks present)
  - [ ] **0.1 secrets rotated (Resend + Turso) — DEFERRED, not blocking, must be re-flagged before R5** (DECISIONS 013)
  - [ ] **0.2 branch protection — UNAVAILABLE on this GitHub plan; substituted by PR-only discipline** (DECISIONS 013)
  - [ ] 0.6 art folder backed up (operator-owned — confirm when done)
  - [ ] 0.7 Vercel previews confirmed (operator-owned — confirm when done)
- [x] R0 process retrofit — `r0-process` — gate Spec §5.2 — **MERGED to `main`** (PRs #3, #4; tagged per operator)
- [x] R1 trail correctness — `r1-trail` — gate Spec §6.2 — **local gate GREEN**; PR pending; **production migration is operator-run (below), not yet done**
- [ ] R2 images & performance — `r2-images` — gate Spec §7.2
- [ ] R3 collection finish — `r3-collection` — gate Spec §8.2
- [ ] R4 content intake — `r4-content` — gate Spec §9.2 (murals content gates R5)
- [ ] R5 go-live — `r5-golive` — gate Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-04, end of R1 session)

**R1 is code-complete on branch `r1-trail`, local gate GREEN. PR not yet opened. The production migration is the operator's to run (runbook below) — the agent never touches production (Iron Invariant 1).**

Local gate result (Spec §6.2, this session, `test-runner`-verified):

```
npm run check                 → lint 0/0, format clean, tsc clean, 50 passed (8 files)
npm run test:coverage         → exit 0, thresholds met. Included files (lines/funcs %):
                                 checkin route 85.71/100 · status route 80.00/100 ·
                                 trail-service 89.83/90 · trail-emails 82.85/100 · art-service 96/100
npx vitest run tests/trail    → 33 passed (7 files)
npm run db:seed-ci; npm build → SSG build succeeds (552 pages) against the file DB
```

### What R1 changed (Architecture §4.2 four holes + §4.4 honesty)

- **`trail_completions` table** (`schema.ts`, `drizzle/0001_add_trail_completions.sql`) — `userId` PRIMARY KEY, unique `redemption_code`, `completed_at`, nullable `redeemed_at`. Retires the `mural_id = 0` sentinel hack.
- **Data migration** `drizzle/0002_migrate_sentinels.sql` — journaled custom migration (idempotent `INSERT OR IGNORE` + `DELETE`) that moves legacy sentinel rows into `trail_completions` then deletes them. Applied automatically by `drizzle-kit migrate`; a harmless no-op on DBs with no sentinels (so tests/CI are unaffected). DECISIONS 021.
- **`trail-service.ts` rewrite** — status counts distinct `mural_id BETWEEN 1 AND N` (N = `MURAL_LOCATIONS.length`, no more sentinel inflation); code read from `trail_completions`; `recordCheckIn` returns `{ status, completionInserted }`; completion is `INSERT … ON CONFLICT(user_id) DO NOTHING RETURNING` (race-safe — exactly one winner emails); CSPRNG code generator (rejection-sampled over the 31-char unambiguous alphabet, `BRP-` prefix, unique-violation retry ≤ 3).
- **checkin route + `trail-emails.ts`** — emails gated on `completionInserted` (no double-send); gallery email lists each mural by its verified `address` with its **own stored** `checked_in_at` in `America/New_York`; all counts from `TRAIL_REQUIRED_CHECKINS`; legacy `TrailProgress` type deleted, replaced by explicit `TrailCompletionEmail`.
- **Content honesty (DECISIONS 022, extends 007)** — `mural-data.ts` `name` now holds the real location/business name; fabricated `description`/`year` values removed (render already guards them, so they vanish; R4 re-adds real ones by data presence). muralId range checks derive from `MURAL_LOCATIONS.length` (operator flagged more murals coming).
- **Tests** under `tests/trail/` (gate runs `npx vitest run tests/trail`): service (incl. the R0 `it.fails` sentinel bug **flipped** to a passing assertion, completion race, code-alphabet property, idempotency), migration (sentinel→completions), checkin + status route integration (`@/auth` + `resend`/`trail-emails` mocked), email builders (ET timestamps, honest labels, no "Mural #0"), and a mural-data honesty guard. `vitest.config.ts` coverage `include` grown to the trail routes + `trail-emails.ts` (DECISIONS 023).

## Operator action — R1 production migration (run this; the agent must not)

⚠ Escalation-ready (Spec §13): if any count below doesn't match, **stop and report** — do not continue.

1. **Precondition:** confirm the R0 baseline is marked applied on production (the one-time SQL from DECISIONS 020). R1's migrate assumes `0000` is already recorded.
2. **Back up** (OPERATOR-GUIDE §R1): `turso db shell byrachelpierce ".dump" > backups/2026-07-xx.sql`
3. **Record the pre-migration sentinel count** — call this **N**:
   `turso db shell byrachelpierce "SELECT COUNT(*) FROM trail_progress WHERE mural_id = 0;"`
4. **Apply** (from your machine, `.env.local` pointing at production Turso): `npx drizzle-kit migrate`
   — applies `0001` (CREATE TABLE trail_completions) then `0002` (sentinel data migration).
5. **Verify** (all must hold, else escalate):
   - `SELECT COUNT(*) FROM trail_progress WHERE mural_id = 0;` → **0**
   - `SELECT COUNT(*) FROM trail_completions;` → **N** (equals the pre-migration sentinel count)
   - `SELECT COUNT(*) FROM trail_completions WHERE redemption_code IS NULL;` → **0** (every legacy code carried)
6. **Redeploy** on Vercel so the new code serves against the migrated schema.
7. **Preview/prod check:** complete a trail run end-to-end with a real magic link to your own inbox — "N/3" stays correct after reload; the gallery email shows real per-check-in timestamps and **no "Mural #0"**.

## Exact next step

1. Open the R1 PR (`r1-trail` → `main`); CI runs automatically. Merge only when CI is green (never on red/skipped).
2. Run the operator migration runbook above (backup → migrate → verify) and redeploy.
3. Once merged, tagged `r1`, and the production migration verified: start **R2** (images & performance) in a fresh Sonnet 5 session. R2 reads Spec §7 + Architecture §6, §12; sanctioned deps `@vercel/blob`, `@playwright/test`.

## Open questions for operator

- None blocking. DECISIONS 021–023 (this session) are informational rulings, not veto points — no action needed unless you disagree. The one visible-behavior item is the mural-content honesty (022, extends the 007 veto point): `/murals`, `/murals/trail`, map popups, and the gallery email now show real **location names** and suppress the fabricated titles/descriptions/years until R4 supplies real content.

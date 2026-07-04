# DECISIONS — byrachelpierce-web

> Running log of judgment calls. Format: id · date · question · choice · why. The agent appends; the operator rules on anything OPEN. Never delete entries — supersede them. Entries 001–012 are the planning session's calls; merging the planning PR approves them except where marked ⚠ VETO POINT (rule on those explicitly).

**001 · 2026-07-03 · Doc strategy.** New `SITE-ARCHITECTURE-v2.md` + `FINAL-BUILD-SPEC.md` supersede; old trail spec archived to `docs/old/` unchanged **except** the committed live Resend key was redacted (security beats archive-fidelity; the key is in git history anyway and is rotated in Phase 0.1). (Operator selected supersede+archive.)

**002 · 2026-07-03 · Ship line.** Rigor + finish current features + go-live (R0–R5). AR tool fully specced now (Architecture §13) but ships next release. (Operator-selected.)

**003 · 2026-07-03 · Leaked-secret handling.** Rotate both credentials (Resend key committed in the v1 spec; Turso token in `Database Token.txt`); no git-history rewrite. Why: rotation kills the risk; history surgery on a shared repo adds risk for cosmetic gain. Rotation is Operator Phase 0.1 and gates everything.

**004 · 2026-07-03 · Trail fix shape.** New `trail_completions` table (user PK, unique code, `completedAt`, `redeemedAt`) replaces the sentinel-row mechanism; migration copies then deletes `mural_id = 0` rows. Rejected: filtering sentinel rows in reads (leaves a lying table shape to trip every future query). **Includes the not-yet-used `redeemedAt` column** so the next-release cashier feature (Appendix A.3) needs no second migration. ⚠ VETO POINT if you'd rather keep the schema minimal.

**005 · 2026-07-03 · Collection rendering.** `/collection` + `/collection/[category]` become `force-dynamic` (searchParams demand it); painting pages stay SSG. Rejected: path-segment pagination (`/page/2`) — more churn for equal outcome at this traffic. (Architecture §2.)

**006 · 2026-07-03 · Code prefix stays `BRP-`.** The v1 spec said `RP-` but shipped code issued `BRP-` codes; changing now would create two families of valid-looking codes at the register. Alphabet/CSPRNG fixed per Architecture §4.2.

**007 · 2026-07-03 · Fabricated mural content is suppressed until R4.** ⚠ VETO POINT — visible behavior change. Trail UI/map/emails show real business-location names instead of the invented mural titles/years/descriptions, until Rachel's real content lands via intake. Why: Iron Invariant 3 (no fiction presented as fact on the public site). Veto = keep showing placeholders until R4 replaces them.

**008 · 2026-07-03 · Images: Vercel Blob** (operator selected the object-storage option; Blob chosen over R2 because the site already lives on Vercel — one dashboard, no new account, free tier covers 205MB). Local dev serves from the gitignored `public/art/` via the `NEXT_PUBLIC_ART_BASE_URL` switch, so dev needs no cloud setup.

**009 · 2026-07-03 · Test stack.** Vitest (+ V8 coverage, thresholds 80% on `src/lib` + `src/app/api`), Testing Library + happy-dom for components, Playwright (chromium) for e2e from R3. All DB access in tests via local libSQL `file:` databases built from `drizzle/` migrations; production Turso is unreachable from tests/CI by construction (no token present).

**010 · 2026-07-03 · npm stays** (not pnpm), lockfile committed in R0, `next-auth` pinned exactly at `5.0.0-beta.25` (two prior adapter breakages = upgrades are escalations, Spec §13.3).

**011 · 2026-07-03 · Analytics = Vercel Analytics**, not GA4. Why: zero-config, no consent-banner obligation, gallery-scale insight needs. Veto if the business wants GA4's depth.

**012 · 2026-07-03 · Baseline migration approach.** R0 snapshots the current schema as `drizzle/0000_*.sql` and the operator marks it applied on production (drizzle baseline procedure) rather than hand-writing SQL to match. Why: file DBs for tests/CI need buildable-from-migrations; production must never be re-created.

**013 · 2026-07-04 · Phase 0 exceptions ruled by operator: secret rotation deferred, branch protection substituted.**
- **0.1 (rotate Resend key + Turso token) is deferred** — back-burnered by the operator, not blocking R0 start. `Database Token.txt` still exists on disk and the old Resend key has not been confirmed revoked as of this entry. This does NOT relax Iron Invariant 2 (no secrets in repo/logs/output) — it means the leaked-credential risk stays open a while longer. **Must be re-flagged before R5 go-live** (production env vars, DNS cutover, and real Resend sending all depend on rotated credentials — Spec §2.4, §10). The agent confirms-not-performs this step (Spec §5.0); until the operator asserts rotation done, R0–R4 proceed on file-DB/mocked-email environments where the distinction is moot (Spec §4.5).
- **0.2 (branch protection on `main`) is unavailable on this GitHub plan** — no paid tier / protection feature on this account. Substitute control: PR-only discipline (CLAUDE.md rule 9 — one milestone branch at a time, Conventional Commits, every commit passes `npm run check`, PRs only, never commit to `main`) plus operator review of every PR before merge. This is a process control, not a technical guardrail, so it depends on the operator and agent actually observing it every time — no CI-enforced blocker exists if it's skipped.
Why: operator ruling, 2026-07-04 session (both raised as blocking-looking Phase 0 items that are intentionally not blocking). Record and continue; do not stall R0 on either.

---

*(Build sessions append from 014 onward.)*

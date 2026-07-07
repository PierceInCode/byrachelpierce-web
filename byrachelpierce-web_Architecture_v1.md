# byrachelpierce-web — Chuck Architecture v1 (takeover layer)

_This is the Chuck-run architecture doc for the takeover run (finish R5, ship v1.0.0). It is a
**binding wrapper**, not a rewrite: the behavior contract remains `docs/SITE-ARCHITECTURE-v2.md`
("the Architecture") and the process contract remains `docs/FINAL-BUILD-SPEC.md` ("the Spec").
Those files are operator-owned and agents never edit them. This doc consolidates every number,
seam, and operational fact a build-time agent needs, so nothing is re-derived from memory.
Where this doc and the governing docs disagree, the governing docs win and the disagreement is
a defect to log._

## 1. Authority map

| Question                                                | Authority                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| What the site does, route behavior, data honesty        | Architecture §1–§7                                                                                      |
| Email / auth contracts                                  | Architecture §8–§9 (Auth.js v5 beta pinned; DB sessions; CSRF sign-out dance stays)                     |
| Security & secrets rules                                | Architecture §10 + Iron rules in `CLAUDE.md`                                                            |
| SEO / analytics / go-live baseline                      | Architecture §11                                                                                        |
| Design language (tokens, type, motion, copy voice)      | Architecture §12 — complete and frozen; drift is a defect, never a choice                               |
| Milestone content R0–R5, gates, CI, escalation triggers | Spec §4–§10, §13                                                                                        |
| This run's milestones M0–M4, gates, protocols           | `BUILD-SPEC.md` (root) + `.chuck/gates.json`                                                            |
| Admin panel (M3) behavior contract                      | this doc §11 + DECISIONS D16/D17                                                                        |
| Judgment ledger                                         | `DECISIONS.md` (root, Chuck-format D-entries); legacy 001–035 archived verbatim in `DECISIONS-r0-r4.md` |
| Execution-verified current state                        | `TAKEOVER-AUDIT-2026-07-06.md`                                                                          |

## 2. System topology (verified at audit)

- **Next.js 15.5.20 App Router, React 19, TypeScript strict.** 34-page build: 10 static, 4 dynamic, 1 SSG family (20 painting pages + `/collection/painting/[slug]`). `/collection` + category pages are `force-dynamic` (searchParams); painting pages are SSG.
- **Data:** Drizzle ORM → Turso libSQL. **Production DB is live** at `byrachelpierce-pierceincode.aws-us-east-1.turso.io` — the same DB Vercel Production _and previews_ read (Spec §4.5). Local dev/tests/CI use `file:` DBs only.
- **Auth:** Auth.js `next-auth@5.0.0-beta.25` (pinned exactly; upgrade = escalation) + Resend magic link + Drizzle adapter, database sessions.
- **Images:** Vercel Blob via `NEXT_PUBLIC_ART_BASE_URL`; `artUrl()` in `src/lib/art-url.ts` is the only URL assembly point; `public/art/` is gitignored (205MB, operator-backed-up).
- **Hosting:** Vercel; production builds from `main`; public production alias `byrachelpierce-web.vercel.app` (deployment-specific URLs sit behind SSO protection and are not probe-able). **`byrachelpierce.com` currently serves a live Wix site** (DNS verified: 185.230.63.x, `www` → wixdns.net); go-live is a DNS cutover with rollback = repoint to Wix (TTL 300).
- **Email:** Resend free tier (100/day, 3,000/month). Until the domain is verified in Resend, test-domain mail delivers only to the account owner — verification moves to M3 (admin magic-links must reach all three admins before cutover; §11).

## 3. Data model (summary; details Architecture §3)

Tables: `users`/`accounts`/`sessions`/`verification_tokens` (Auth.js), `paintings` (528 rows incl. `width_in`/`height_in`/`depth_in` since 0003), `tags`/`tag_categories`/`painting_tags`, `trail_progress` (check-ins, `mural_id` 1–14), `trail_completions` (one row per completed user; CSPRNG `BRP-` codes). Murals themselves are **checked-in code** (`src/lib/mural-data.ts`, 14 entries), not DB rows.

Migrations: `drizzle/0000`–`0003`, journal-tracked; production has `__drizzle_migrations` (4 rows, seeded 2026-07-06 per legacy DECISIONS 035 — re-verification is an M0 gate). **Migration discipline (inviolable):** additive-only at production; backup → operator authorization → apply → verify counts; column-adding migrations reach production BEFORE the code that reads them merges (preview/prod builds read production Turso — legacy DECISIONS 034). `drizzle-kit push` is never used against production.

## 4. Numeric budgets (the numbers agents would otherwise guess)

| Budget                                                                     | Value                                                                                | Where enforced                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Coverage (vitest, `src/lib/**` + `src/app/api/**`)                         | ≥ 80% lines / 80% functions — **never lowered**; current actuals 90.36% / 97.67%     | `vitest.config.ts` thresholds; every gate run                                         |
| Lint                                                                       | 0 errors, 0 warnings (`--max-warnings 0`)                                            | `npm run lint`                                                                        |
| Collection grid images, first viewport @390px                              | < 1.5 MB transferred                                                                 | Playwright request accounting (e2e)                                                   |
| Painting hero image                                                        | < 600 KB                                                                             | Playwright request accounting (e2e)                                                   |
| Lighthouse mobile — `/`, `/collection`, one painting page, `/murals/trail` | Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 (public pages only; `/admin` exempt)  | `npm run lighthouse` (M1 wires `@lhci/cli` assertions; M4 re-runs against production) |
| Build                                                                      | all pages, 0 errors (34 at baseline; grows at M1 sitemap/robots and M3 admin routes) | seeded `next build`                                                                   |
| e2e                                                                        | 12 tests baseline (grows in M1 and M3), 0 failures, 0 silent skips                   | `npm run e2e`                                                                         |
| Email volume                                                               | ≤ 100/day (Resend free tier) — never send real mail from tests                       | mocked `resend`; key absent in CI                                                     |
| Touch targets                                                              | ≥ 44px                                                                               | Architecture §12.5; Cutter reviews                                                    |

## 5. Environment truth table (Spec §4.5, audit-annotated)

| Context           | DB                                     | Email                 | Trap to remember                                                                                                                                       |
| ----------------- | -------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local dev         | `file:./dev.db` (`.env.local` default) | test domain or unset  | prod creds sit **commented** in `.env.local`; never print them                                                                                         |
| Vitest            | per-test `file:` temp DB               | mocked                | —                                                                                                                                                      |
| CI                | `file:./ci.db`                         | absent                | CI sets `TURSO_DATABASE_URL` at job level                                                                                                              |
| Local build/e2e   | `file:./ci.db`                         | absent                | **must export `TURSO_DATABASE_URL=file:./ci.db` in the shell** — `db:seed-ci`/`build` do not read each other's env; there is no `.env.test` (audit F1) |
| Vercel preview    | **production Turso**                   | test domain           | schema drift breaks preview builds first (legacy DECISIONS 034)                                                                                        |
| Vercel production | production Turso                       | verified domain (M3+) | —                                                                                                                                                      |

## 6. Production operations contract (audit F6/F7 remediations land in M0)

- The Turso cloud CLI is **not installed** on the dev machine; all production DB access goes through `@libsql/client` (+ drizzle migrator for migrations), reading creds from `.env.local`'s commented lines without ever printing them.
- **Backups:** `scripts/backup-prod.ts` (M0) dumps **all app tables** as dated JSON into `backups/` — one `backups/<table>-<YYYY-MM-DD>.json` per table, each a JSON array of row objects; `backup-check.mjs` gates that shape and the paintings row count (528). Its restore procedure is documented in the script header and proven by the M0 `restore-roundtrip` gate (`tests/backup-restore.roundtrip.test.ts`, local `file:` DBs only). Backup-first is a recorded protocol step before any production write.
- **Read-only verification probes** (`.chuck/probes/`) are sanctioned agent-runnable production access: SELECT/PRAGMA only, zero writes, no cred output (DECISIONS D8). Anything that writes production remains operator-authorized, backup-first, additive-only.
- Anonymous HTTP smoke tests target `https://byrachelpierce-web.vercel.app` (pre-cutover) and `https://byrachelpierce.com` (post-cutover).

## 7. Content honesty (Iron Invariant — Architecture §4.4, §5.3, §7)

- The public site never renders invented facts. Mural `description`/`year` are **absent today by design** (suppressed by data presence); the M2 content loop fills them from Rachel's CSV and overwrites `name` with each mural's real title. The machine-checkable un-suppression signal: entries in `mural-data.ts` with a non-empty `description` (0/14 now → 14/14 at M2 exit).
- Ingest never guesses: unparseable `physical_size` routes to the error report and writes nothing; blank cells mean no change; `--dry-run` is the default and `--apply` is explicit.
- Unknown availability renders as nothing (no false "Available"). The trail may not go live with placeholder fiction — this blocks the M4 cutover on M2's gate.

## 8. Security posture (Architecture §10, audit-annotated)

- **Leak precedent is live:** a Resend key and a Turso token were leaked pre-R0; rotation was deferred (legacy DECISIONS 013) and **is executed in M0 (protocol HT1), not deferred again.** The leak predates this repo: an executed all-branch history sweep (2026-07-07, refutation R4) found zero secret-shaped strings — only an unusable 11-character key prefix appears, in two committed docs. Rotation is owed because the values were exposed outside git (the old trail-spec document trail), not because they sit in this history. The M4 secret sweep fails on ANY secret-shaped string; its former known-rotated allowlist matched nothing and was removed.
- No secrets in repo/logs/agent output, ever. Tests send no real email. CI carries no production credentials (enforced by absence).
- Input validation at API boundaries (check-in route is the template); Drizzle parameterized builders only; no new attack surface (uploads/comments/webhooks) without a DECISIONS amendment.
- Threat model is small (no UGC, no payments) — keep it that way; dependency CVEs are triaged within one milestone (audit L9 verified the one open case resolved).

## 9. Review dimensions for the verification wave (Binkley's Closet)

- **Bobbi (code):** against Spec §3 engineering rules + this doc; TS strict, no `any`/`@ts-expect-error`/non-null-assertions on external data without a DECISIONS entry.
- **Ronald-Ann (silent failures):** ingest skip-vs-apply paths, email send guards (`completionInserted`), probe scripts' error paths, catch blocks around libsql calls.
- **Steve (security/compliance):** secret handling in M0 rotation + M4 sweep, dependency licenses (product is proprietary; deps must be permissive OSI — MIT/Apache-2.0/BSD/ISC), Auth.js seam, and the M3 admin surface (`requireAdmin()` on every action, upload validation) — the one sanctioned new surface (D16).
- **Cutter (a11y/UX):** WCAG on changed UI, keyboard paths, ≥44px targets, `prefers-reduced-motion` respected; Lighthouse A11y ≥ 95 is the deterministic floor, Cutter judges journeys.
- **Portnoy (performance):** the §4 budget table, measured on gate runs — Lighthouse numbers and Playwright image-weight accounting quoted verbatim.
- **Lola (SEO/content):** sitemap/robots/canonical/OG correctness (M1), unique title+description per public page, copy voice per Architecture §12.7 (warm gallery "we", sentence case, no fake urgency), redirect map completeness vs the Wix URL list.
- **Quiche (design drift):** every color a §12.2 token (email templates exempt per §8), Playfair/Jura/system stack per §12.3, spacing/radius/motion tokens per §12.4, component recipes per §12.5. New hex values require a DECISIONS amendment.

## 10. Post-launch shape (post-Gate-2; details in BUILD-SPEC Post-launch)

Fix-flow: branch → PR → green CI → merge `main` → Vercel deploy. Wix stays warm for one week post-cutover as rollback; then the operator cancels it. Trail stats standing queries run via the libsql path (not the uninstalled turso CLI). The AR sizing tool (Architecture §13) is the named next release and is **out of scope** for this run.

## 11. Admin panel contract (milestone M3 — added at Gate 1 intake, 2026-07-07; DECISIONS D16/D17)

_Section references: "Architecture §N" means the governing `docs/SITE-ARCHITECTURE-v2.md`; bare "§N" means this document._

Non-developer CRUD over the painting collection, shipping before cutover so the ops manager can edit and QC the live collection through it. Everything a build agent needs is pinned here; anything not written here is not decided and goes to DECISIONS.

- **Routes:** `/admin` (painting list: search by title/slug, filter archived/live, link to edit), `/admin/paintings/new` (create), `/admin/paintings/[id]` (edit + archive/restore). App Router Server Components + **Server Actions** for every mutation (no new API routes). `/admin` is `robots` -disallowed, excluded from the sitemap, and carries `noindex`.
- **Authorization:** additive column `users.is_admin` (INTEGER NOT NULL DEFAULT 0). Sign-in stays the existing Auth.js magic-link flow — no new auth system, no passwords. A shared `requireAdmin()` helper runs at the top of every admin page AND every server action: loads the DB session's user, checks `is_admin = 1`, and calls `notFound()` (404 — the panel is never advertised) otherwise. Client-side checks are decoration; the server check is the contract. Admins: matthew/rachel/laciey @byrachelpierce.com. Admin management is CLI-only: `npx tsx scripts/set-admin.ts <email> <0|1>` (unit-tested; against production it is an operator-run ritual write). No admin-management UI, ever, this release.
- **Prerequisite (operator, before HT4):** Resend domain verification (SPF + DKIM) moves EARLIER, into M3 — magic links must deliver to all three admin inboxes pre-cutover (test-domain mail only reaches the account owner). `BLOB_READ_WRITE_TOKEN` must exist in the Vercel production env (panel uploads run server-side; the token never enters `.env.local` or agent context).
- **Soft delete:** additive column `paintings.archived_at` (TEXT ISO-8601, NULL = live). Archive/restore flips it; **no row is ever hard-deleted from the panel.** Every public read path — collection grids, category pages, painting page, search, tag counts, sitemap — filters `archived_at IS NULL`. Archived paintings remain visible in `/admin` with a restore action. An archived painting's public URL 404s.
- **Fields editable:** title, medium, formatType, location, physicalSize (free text), widthIn/heightIn/depthIn (numeric, blank = unknown — never guessed, same honesty rule as ingest), availability, series, notes. **Slug is immutable in the panel** (permalink/SEO safety; new paintings get it generated). Tags: attach/detach existing tags; create a new tag inside an existing category (name + category picker); tag-category CRUD is out of scope.
- **Create + upload:** the create form collects **the same field set as edit** (title required; every other field optional and blank-safe — blank means unknown, never guessed) plus tag selection and exactly two pre-processed JPEGs (Photoshop pipeline): a web image (hard server-side cap **600 KB** — the e2e hero budget) and a thumbnail (cap **200 KB**). **The form's "Description" label writes the existing `notes` column** — `paintings` has no `description` column and migration 0004 does not add one (refutation Δ1). Server action validates content-type `image/jpeg` and size caps, computes an 8-hex content hash (first 8 of SHA-256), and `put()`s to Blob as `web/<slug>-<hash8>.jpg` and `thumbs/<slug>-<hash8>.jpg` (the existing path convention; URLs still assembled only by `artUrl()`). `width_px`/`height_px` are parsed server-side from the JPEG SOF header (small TDD'd util — **no new dependency**); `orientation` derives: width>height Landscape, width<height Portrait, else Square. Slug generates from the title (lowercase, hyphenated, deduped with a numeric suffix on collision — uniqueness enforced by the DB constraint). `created_at`/`updated_at` set to ISO now.
- **Revalidation (SSG interplay):** painting pages are SSG with `dynamicParams` defaulting true, so created slugs render on demand; edits/archives call `revalidatePath('/collection')`, `revalidatePath('/collection/painting/<slug>')`, the affected category pages, and `revalidatePath('/sitemap.xml')` after every successful mutation. The observable bound: a panel edit is publicly visible within 60 seconds.
- **Testing seam:** unit tests mock `@vercel/blob` and `@/auth` as the suite already does. E2E admin journeys authenticate by seeding: `db:seed-ci` gains an admin user + a DB session row, and Playwright sets the `authjs.session-token` cookie (plain name — local e2e is http; the `__Secure-` prefix applies only on https). Journeys: non-admin/anonymous 404 on `/admin`; edit title → visible on the public painting page; archive → gone from `/collection` and `/sitemap.xml`, restore → back; create is covered by unit tests (Blob mocked) + HT4's real-upload row — e2e does NOT fake a Blob upload as passed (honesty rule).
- **Security posture (extends §8):** this is the sanctioned new attack surface (D16 is the DECISIONS entry §8 requires). Steve's M3 review covers: `requireAdmin()` on every action (enumerated), upload validation (type/size/path), no reflected filenames, Drizzle parameterized everything, no secret ever client-side. Production row-level painting writes through the authenticated panel are sanctioned by D17's Invariant-1 amendment; schema changes and bulk/raw SQL remain operator-ritual-only.
- **Design language:** the governing Architecture §12 tokens/type/components apply to `/admin` (it is still this site); Lighthouse budgets do NOT apply to `/admin` (not a public page); ≥44px touch targets still bind (Cutter reviews — the ops manager works from a phone sometimes).
- **Count contract (D17):** the collection count is no longer a constant once the panel is live. Gates that assert 528 are point-in-time and all run pre-panel (M0 `prod-verify`, M2 `backup-check`); from M4 on, count gates compare two live sources instead (`sitemap-vs-db`: sitemap painting URLs === DB non-archived count).

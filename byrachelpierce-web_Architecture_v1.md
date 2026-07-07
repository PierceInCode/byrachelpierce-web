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
| This run's milestones M0–M3, gates, protocols           | `BUILD-SPEC.md` (root) + `.chuck/gates.json`                                                            |
| Judgment ledger                                         | `DECISIONS.md` (root, Chuck-format D-entries); legacy 001–035 archived verbatim in `DECISIONS-r0-r4.md` |
| Execution-verified current state                        | `TAKEOVER-AUDIT-2026-07-06.md`                                                                          |

## 2. System topology (verified at audit)

- **Next.js 15.5.20 App Router, React 19, TypeScript strict.** 34-page build: 10 static, 4 dynamic, 1 SSG family (20 painting pages + `/collection/painting/[slug]`). `/collection` + category pages are `force-dynamic` (searchParams); painting pages are SSG.
- **Data:** Drizzle ORM → Turso libSQL. **Production DB is live** at `byrachelpierce-pierceincode.aws-us-east-1.turso.io` — the same DB Vercel Production _and previews_ read (Spec §4.5). Local dev/tests/CI use `file:` DBs only.
- **Auth:** Auth.js `next-auth@5.0.0-beta.25` (pinned exactly; upgrade = escalation) + Resend magic link + Drizzle adapter, database sessions.
- **Images:** Vercel Blob via `NEXT_PUBLIC_ART_BASE_URL`; `artUrl()` in `src/lib/art-url.ts` is the only URL assembly point; `public/art/` is gitignored (205MB, operator-backed-up).
- **Hosting:** Vercel; production builds from `main`; public production alias `byrachelpierce-web.vercel.app` (deployment-specific URLs sit behind SSO protection and are not probe-able). **`byrachelpierce.com` currently serves a live Wix site** (DNS verified: 185.230.63.x, `www` → wixdns.net); go-live is a DNS cutover with rollback = repoint to Wix (TTL 300).
- **Email:** Resend free tier (100/day, 3,000/month). Until the domain is verified in Resend (M3), test-domain mail delivers only to the account owner.

## 3. Data model (summary; details Architecture §3)

Tables: `users`/`accounts`/`sessions`/`verification_tokens` (Auth.js), `paintings` (528 rows incl. `width_in`/`height_in`/`depth_in` since 0003), `tags`/`tag_categories`/`painting_tags`, `trail_progress` (check-ins, `mural_id` 1–14), `trail_completions` (one row per completed user; CSPRNG `BRP-` codes). Murals themselves are **checked-in code** (`src/lib/mural-data.ts`, 14 entries), not DB rows.

Migrations: `drizzle/0000`–`0003`, journal-tracked; production has `__drizzle_migrations` (4 rows, seeded 2026-07-06 per legacy DECISIONS 035 — re-verification is an M0 gate). **Migration discipline (inviolable):** additive-only at production; backup → operator authorization → apply → verify counts; column-adding migrations reach production BEFORE the code that reads them merges (preview/prod builds read production Turso — legacy DECISIONS 034). `drizzle-kit push` is never used against production.

## 4. Numeric budgets (the numbers agents would otherwise guess)

| Budget                                                                     | Value                                                                            | Where enforced                                                                        |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Coverage (vitest, `src/lib/**` + `src/app/api/**`)                         | ≥ 80% lines / 80% functions — **never lowered**; current actuals 90.36% / 97.67% | `vitest.config.ts` thresholds; every gate run                                         |
| Lint                                                                       | 0 errors, 0 warnings (`--max-warnings 0`)                                        | `npm run lint`                                                                        |
| Collection grid images, first viewport @390px                              | < 1.5 MB transferred                                                             | Playwright request accounting (e2e)                                                   |
| Painting hero image                                                        | < 600 KB                                                                         | Playwright request accounting (e2e)                                                   |
| Lighthouse mobile — `/`, `/collection`, one painting page, `/murals/trail` | Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95                                   | `npm run lighthouse` (M1 wires `@lhci/cli` assertions; M3 re-runs against production) |
| Build                                                                      | 34/34 pages, 0 errors                                                            | seeded `next build`                                                                   |
| e2e                                                                        | 12 tests baseline (grows in M1), 0 failures, 0 silent skips                      | `npm run e2e`                                                                         |
| Email volume                                                               | ≤ 100/day (Resend free tier) — never send real mail from tests                   | mocked `resend`; key absent in CI                                                     |
| Touch targets                                                              | ≥ 44px                                                                           | Architecture §12.5; Cutter reviews                                                    |

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
- Unknown availability renders as nothing (no false "Available"). The trail may not go live with placeholder fiction — this blocks the M3 cutover on M2's gate.

## 8. Security posture (Architecture §10, audit-annotated)

- **Leak precedent is live:** a Resend key and a Turso token were leaked pre-R0; rotation was deferred (legacy DECISIONS 013) and **is executed in M0 (protocol HT1), not deferred again.** The leak predates this repo: an executed all-branch history sweep (2026-07-07, refutation R4) found zero secret-shaped strings — only an unusable 11-character key prefix appears, in two committed docs. Rotation is owed because the values were exposed outside git (the old trail-spec document trail), not because they sit in this history. The M3 secret sweep fails on ANY secret-shaped string; its former known-rotated allowlist matched nothing and was removed.
- No secrets in repo/logs/agent output, ever. Tests send no real email. CI carries no production credentials (enforced by absence).
- Input validation at API boundaries (check-in route is the template); Drizzle parameterized builders only; no new attack surface (uploads/comments/webhooks) without a DECISIONS amendment.
- Threat model is small (no UGC, no payments) — keep it that way; dependency CVEs are triaged within one milestone (audit L9 verified the one open case resolved).

## 9. Review dimensions for the verification wave (Binkley's Closet)

- **Bobbi (code):** against Spec §3 engineering rules + this doc; TS strict, no `any`/`@ts-expect-error`/non-null-assertions on external data without a DECISIONS entry.
- **Ronald-Ann (silent failures):** ingest skip-vs-apply paths, email send guards (`completionInserted`), probe scripts' error paths, catch blocks around libsql calls.
- **Steve (security/compliance):** secret handling in M0 rotation + M3 sweep, dependency licenses (product is proprietary; deps must be permissive OSI — MIT/Apache-2.0/BSD/ISC), Auth.js seam, no new surface.
- **Cutter (a11y/UX):** WCAG on changed UI, keyboard paths, ≥44px targets, `prefers-reduced-motion` respected; Lighthouse A11y ≥ 95 is the deterministic floor, Cutter judges journeys.
- **Portnoy (performance):** the §4 budget table, measured on gate runs — Lighthouse numbers and Playwright image-weight accounting quoted verbatim.
- **Lola (SEO/content):** sitemap/robots/canonical/OG correctness (M1), unique title+description per public page, copy voice per Architecture §12.7 (warm gallery "we", sentence case, no fake urgency), redirect map completeness vs the Wix URL list.
- **Quiche (design drift):** every color a §12.2 token (email templates exempt per §8), Playfair/Jura/system stack per §12.3, spacing/radius/motion tokens per §12.4, component recipes per §12.5. New hex values require a DECISIONS amendment.

## 10. Post-launch shape (post-Gate-2; details in BUILD-SPEC Post-launch)

Fix-flow: branch → PR → green CI → merge `main` → Vercel deploy. Wix stays warm for one week post-cutover as rollback; then the operator cancels it. Trail stats standing queries run via the libsql path (not the uninstalled turso CLI). The AR sizing tool (Architecture §13) is the named next release and is **out of scope** for this run.

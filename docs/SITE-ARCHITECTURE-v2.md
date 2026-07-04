# by Rachel Pierce — Site Architecture & Behavior Contract v2

**Version:** 2.0 — July 2026
**Status:** Approved for build
**Supersedes:** `docs/old/trail-spec.md` (the March 2026 Mural Selfie Trail spec, archived unchanged apart from a redacted leaked API key). Where that document and the code disagree, this document is the contract.
**Companion:** `docs/FINAL-BUILD-SPEC.md` ("the Spec") is the contract for *how* this gets built — order, gates, process. This document is the contract for *what the system does*. Behavior conflicts: this document wins. Process conflicts: the Spec wins.
**Audience:** Claude Code build sessions (Opus 4.8 / Sonnet 5 / Haiku 4.5) supervised by the operator (Matthew). The operator's instructions are `OPERATOR-GUIDE.md`; the agent's standing orders are `CLAUDE.md`.

---

## 1. What This Site Is

byrachelpierce.com is the marketing and experience website for **by Rachel Pierce**, an art gallery on Sanibel Island, Florida (1571 Periwinkle Way). Rachel Pierce paints originals (watercolor, acrylic, oil, mixed media) and has painted 14 public murals across the island.

The site is **not a store**. E-commerce lives on an external Lightspeed shop (`SHOP_URL` in `src/lib/constants.ts`) that opens in a new tab. The site's jobs, in priority order:

1. Make a tourist standing in the gallery (or scrolling on the beach) want to visit and buy.
2. Present the full painting collection (528 works) browsably and searchably.
3. Run the **Mural Selfie Trail** — a gamified check-in experience across the 14 murals that ends with a redemption code for a gift at the gallery.
4. (Next release) Let a buyer preview any dimensioned painting at true scale on their own wall via AR (§13).

**The audience is on a phone.** Tourists on cellular connections are the primary users. Every behavior decision in this document is subordinate to: fast on mobile, honest content, zero friction.

### 1.1 Topology

```
Browser (mostly mobile Safari/Chrome)
   │
   ▼
Vercel — Next.js 15 App Router, React 19, TypeScript strict
   │  static pages + SSG painting pages + dynamic collection/trail routes
   │  API routes: /api/auth/*, /api/trail/*
   ├────────► Turso (libSQL/SQLite, aws-us-east-1) — via Drizzle ORM
   │            auth tables · trail tables · paintings/tags catalog
   ├────────► Resend — magic-link emails (Auth.js) + trail emails
   └────────► Vercel Blob — art images (web + thumbs), from R2 milestone on
External: Lightspeed shop (link only) · Instagram/Facebook/YouTube (links only)
```

There is exactly one production database and it is **live** — see the Prime Invariant (Spec §3, rule 1).

---

## 2. Runtime & Rendering Model

This section resolves the previously-undefined rendering contract. It is normative.

| Route | Rendering | Why |
|---|---|---|
| `/`, `/story`, `/visit`, `/contact`, `/press`, `/custom`, `/ar`, `/murals` | Static (build time) | Pure marketing content |
| `/collection` and `/collection/[category]` | **Dynamic** (`export const dynamic = 'force-dynamic'`) | These pages read `searchParams` (search, filters, pagination). Mixing `generateStaticParams` with `searchParams` produces a page that *builds* as SSG but serves filter/page requests unpredictably. R3 removes `generateStaticParams` from `[category]` and declares both routes dynamic. Turso latency from us-east-1 to Vercel is single-digit ms; traffic is gallery-scale. |
| `/collection/painting/[slug]` | SSG via `generateStaticParams` (all 528+) | Painting pages are content-stable between content ingests; each ingest ends in a redeploy (§7.4) |
| `/murals/trail` | Static shell + client `TrailClient` fetching `/api/trail/status` | Unchanged from current implementation |
| `/api/auth/*`, `/api/trail/*` | Dynamic (route handlers) | — |

**Build-time DB dependency (documented contract):** `next build` executes `generateStaticParams` for painting pages, which queries the database via `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` env vars. Consequences:

- CI and local builds run against a **seeded local file database** (`TURSO_DATABASE_URL=file:./ci.db`), never production (Spec §4.5). The libSQL client supports `file:` URLs natively; no code change is needed, only env.
- Vercel production builds use the production Turso env vars set in the Vercel dashboard.
- New/changed paintings appear on the site only after a redeploy. The content-ingest workflow (§7.4) ends with one.

---

## 3. Data Model

All tables in `src/db/schema.ts`, Drizzle + Turso (SQLite). Auth.js tables (`users`, `accounts`, `sessions`, `verificationTokens`) MUST keep the exact shapes required by `@auth/drizzle-adapter` — the in-file comments documenting those shape constraints are load-bearing; never "clean them up."

### 3.1 Existing app tables (unchanged)

- `trail_progress` — one row per check-in: `id`, `user_id` (FK users, cascade), `mural_id` (1–14 **only** — see §4.2 change), `checked_in_at` (ISO-8601 text), `redemption_code` (**deprecated column** after R1 — see §4.2; retained, always NULL for new rows).
- `email_list` — dormant until the next release (Appendix A.4).
- `paintings`, `tag_categories`, `tags`, `painting_tags` — the 528-work catalog. `painting_tags.source`/`confidence` record whether a tag came from the extraction pipeline or a human.

### 3.2 New in R1: `trail_completions`

```ts
export const trailCompletions = sqliteTable("trail_completions", {
  userId: text("user_id").primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  redemptionCode: text("redemption_code").notNull().unique(),
  completedAt: text("completed_at").notNull(),   // ISO-8601
  redeemedAt: text("redeemed_at"),               // NULL until redeemed; UI is next-release (Appendix A.3)
});
```

`userId` as primary key makes "one completion per user" a database guarantee and makes the completion race (§4.2 hole 3) unwinnable: concurrent completers race on `INSERT … ON CONFLICT DO NOTHING`, then both read back the single surviving row.

### 3.3 New in R4: painting dimension columns

```ts
// added to paintings table
widthIn:  real("width_in"),    // physical width, inches. NULL = unknown
heightIn: real("height_in"),   // physical height, inches. NULL = unknown
depthIn:  real("depth_in"),    // canvas depth, inches. NULL = default 0.75 for display purposes
```

`physicalSize` (free text like `24" x 36"`) remains as the human-entered source; the ingest script (§7.3) parses it into these numeric columns and flags unparseable values in its report rather than guessing. **The AR tool (§13) reads only the numeric columns.** Currently 0 of 528 paintings have any physical size — collecting this is R4 content work, and AR eligibility is gated on it.

### 3.4 Migration discipline

The production database is live and shared with the currently-deployed site. Every schema change:

1. Is **additive-only** during this release (new tables, new nullable columns). Destructive changes (drops, type changes) are an escalation (Spec §13).
2. Ships as a reviewed SQL migration file under `drizzle/` (generated by `drizzle-kit generate`, applied by `drizzle-kit migrate`) — **never** `drizzle-kit push` against production. `push` is permitted only against local `file:` databases.
3. Is preceded by an operator-run backup: `turso db shell byrachelpierce ".dump" > backups/<date>.sql` (OPERATOR-GUIDE §R1). The agent never runs the migration against production; the operator does, following the runbook.

---

## 4. Mural Selfie Trail — Behavior Contract

Design philosophy (unchanged from v1): *marketing with fun, not a policed system*. Check-ins are self-reported; the in-person redemption is the fraud gate. No geolocation enforcement.

### 4.1 Flow (unchanged)

Email → Auth.js magic link (Resend, 24h expiry) → session → check in at any `TRAIL_REQUIRED_CHECKINS` (default 3) distinct murals of the 14 → redemption code emailed to the user + notification to the gallery → user shows the email at the register.

Client state machine in `TrailClient.tsx`: `LOADING → SIGNED_OUT | AWAITING_MAGIC → IN_PROGRESS → COMPLETED`. Returning users resume via a fresh magic link; progress is server-side.

### 4.2 Corrections to the implemented behavior (the R1 work)

These four defects were found in the July 2026 audit. The behaviors below are normative; the old behaviors are bugs.

**Hole 1 — sentinel row corrupts status (fix: `trail_completions`).**
*Was:* completion stored the redemption code on an extra `trail_progress` row with `mural_id: 0`; every later status read counted that row, reporting e.g. "4/3 murals visited" and leaking mural id `0` to the client and into the gallery email ("Mural #0 (unknown)").
*Is:* the code lives in `trail_completions` (§3.2). `getTrailStatus` counts distinct `mural_id` from `trail_progress` **where `mural_id` BETWEEN 1 AND 14**, and reads the code from `trail_completions`. `recordCheckIn` never writes sentinel rows. The R1 migration moves each existing `mural_id = 0` row's `(user_id, redemption_code, checked_in_at)` into `trail_completions` and then deletes those rows; already-issued codes keep working.

**Hole 2 — code generation (fix: crypto + unambiguous alphabet).**
*Was:* `Math.random()` over `A–Z0–9`, so codes like `BRP-0OI1LU` exist.
*Is:* `crypto.getRandomValues()` (rejection-sampled to avoid modulo bias) over the 31-character alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no I, L, O, 0, 1), 6 characters, prefix `BRP-`. ~887M codes; the `UNIQUE` constraint on `redemption_code` turns the residual collision into a retry loop (max 3 attempts, then throw). The prefix stays `BRP-` — codes already issued use it (DECISIONS 006).

**Hole 3 — completion race (fix: constraint, not locking).**
*Was:* two concurrent check-ins could both observe "complete, no code" and issue two codes + two email pairs.
*Is:* completion is `INSERT INTO trail_completions … ON CONFLICT(user_id) DO NOTHING`, followed by a read-back of the canonical row. Completion emails are sent **only** by the request whose insert actually inserted (libSQL reports `rowsAffected`). Losers of the race return the canonical code with no emails.

**Hole 4 — email fidelity.**
*Was:* the gallery notification stamped every check-in with `new Date()` at completion time, and the user email hardcoded "You visited 3 …".
*Is:* the gallery email lists each mural with its **stored** `checked_in_at` timestamp (rendered in `America/New_York`); every count in both emails renders from `TRAIL_REQUIRED_CHECKINS`. The email helper's parameter type changes from the legacy `TrailProgress` JSON shape to an explicit `{ email, code, completedAt, checkIns: {muralId, checkedInAt}[] }` — the legacy shape in `src/types/index.ts` is deleted with it.

### 4.3 API contract (post-R1)

- `GET /api/trail/status` → `{ authenticated, progress: { totalCheckIns, requiredCheckIns, checkedInMuralIds (⊆ 1..14), questComplete, redemptionCode } | null }`. Unauthenticated is `200` with `authenticated: false` (the page renders the sign-in state; it is not an error).
- `POST /api/trail/checkin` `{ muralId: 1..14 }` → validates session (401) and muralId (400), idempotent per (user, mural), returns updated status. `5xx` bodies never leak internals — generic message, details to server logs.
- Emails are fire-and-forget (`Promise.allSettled`), never block the response, and every failure logs one line with the user id and email kind.

### 4.4 Trail content honesty rule

`src/lib/mural-data.ts` coordinates and addresses are verified real (geocoded March 2026 — keep the in-file warning). The mural **names, descriptions, and years are fabricated placeholders**. Until R4 replaces them with Rachel's real content:

- The trail UI and map popups show the **location business name** (already real, e.g. "Lighthouse Cafe") as the primary label, with the invented mural title, description and year **suppressed** — not restyled, removed from render (data stays in the file for R4 to overwrite).
- Gallery emails identify murals by location name + address.

This is DECISIONS 007 (operator veto point). Rationale: Iron Invariant 3 — the public site never presents invented facts as real. R4's content intake (§7) makes this section moot before go-live (R5 gates on it).

---

## 5. Collection — Behavior Contract

The 528-painting catalog, the uncommitted June work being landed in R0 and finished in R3.

### 5.1 Browsing model

- `/collection` — all paintings, paged (`PAGE_SIZE = 24`), plus category cards.
- `/collection/[category]` — nine marketing categories defined by `CATEGORY_TAG_MAP` in `constants.ts` (tag lists / medium / formatType filters). The map is content configuration; changing it is a content decision, not a code decision.
- `/collection/painting/[slug]` — detail page: image, title, medium, physical size (when known), availability, tags grouped by category, up to 6 related works (shared-tag ranking), cross-sell to the shop.
- Search (`?q=`) matches title and notes via `LIKE` (parameterized by Drizzle — keep it that way); filters combine as AND; pagination preserves active filters.

### 5.2 Correctness requirements (R3 gates)

1. Filters, search, and pagination **work on the deployed site**, not just `next dev` — this requires the §2 rendering change and a `next build && next start` verification plus Playwright coverage, because the current SSG/searchParams mix can silently serve page 1 unfiltered forever.
2. Empty states are designed, not accidental: a category with zero matches, a search with zero hits, and page numbers out of range each render the empty-state pattern (§12.6), never a crash or a blank grid.
3. `data-` fix: the `'LillyOther plants'` tag string in `CATEGORY_TAG_MAP.florals` is two names fused by a data bug; R3 resolves it against the real tag table (expect `Lilly` + `Other plants`) and adds a startup-time (test-time) assertion that every tag named in `CATEGORY_TAG_MAP` exists in the `tags` table — a misspelled tag silently empties a category today.

### 5.3 Availability display rule

`paintings.availability` is authoritative. Render exactly:

| `availability` value | Painting page shows |
|---|---|
| `NULL` / empty (527 of 528 today) | **Nothing** — no availability claim at all |
| "Available" (any casing) | "Available at the gallery" + shop cross-sell |
| "Sold" | "Sold" badge (slate, not coral); cross-sell switches to "commission a similar piece" (`/custom`) |
| anything else | The literal text, verbatim |

The current metadata default "Available at the Sanibel Island gallery" for every painting is an honesty bug (Invariant 3): R3 removes the claim from `generateMetadata` descriptions when availability is unknown.

---

## 6. Images — Pipeline Contract

**Decision (operator-approved): Vercel Blob + `next/image`; images leave the git tree.**

- **Source of truth:** the operator's local `public/art/` (192MB web + 14MB thumbs, 528 works × {web, thumb}, content-hashed filenames like `abirdersdream-88fc976a.jpg`). This folder is **gitignored** (rule added in the planning commit) and additionally backed up by the operator outside the repo (OPERATOR-GUIDE Phase 0.6).
- **Upload:** `scripts/sync-art-blob.ts` (R2 milestone) walks `public/art/`, uploads to Vercel Blob preserving the `web/…`/`thumbs/…` path structure, skips already-present blobs by pathname (content-hashed names make this safe), `--dry-run` flag, and prints a summary table. Idempotent by construction.
- **Serving:** one env var, `NEXT_PUBLIC_ART_BASE_URL` — the Blob public base URL in deployed environments, `/art` locally (so dev works from the local folder with zero setup). A single helper `artUrl(path: string)` in `src/lib/art-url.ts` is the **only** place URLs are assembled; DB `web_image_path`/`thumb_path` values stay relative forever.
- **Rendering:** every artwork rendering goes through `next/image` with real `width`/`height` (the DB has `width_px`/`height_px`), `sizes` attributes matched to the §12 grid breakpoints, and `loading="lazy"` below the fold. `next.config.ts` gains a `remotePatterns` entry for `*.public.blob.vercel-storage.com`. The `<img>` tags in `ArtworkCard`, painting pages, and the home page are replaced in R2.
- **Budget (gated):** the collection grid page transfers **< 1.5MB of images** on first viewport at 390px width; a painting detail page **< 600KB** for the hero image. Measured in the R2 gate via Playwright request accounting.
- **Never** commit files under `public/art/`; never load image binaries into agent context (CLAUDE.md context hygiene).

---

## 7. Content Model & Intake

Real content exists only in Rachel's/Matthew's heads and records. This section defines the only pipeline by which it enters the system. The operator-writable folder is **`docs/intake/`** — the doc-guard hook allows writes there.

### 7.1 Mural content sheet — `docs/intake/murals.csv`

One row per mural, columns exactly:
`id` (1–14, matches `mural-data.ts`), `real_name`, `description` (1–2 sentences, Rachel's voice), `year_painted` (4-digit or blank), `photo_filename` (image supplied by operator into `docs/intake/mural-photos/`, optional).

### 7.2 Painting data sheet — `docs/intake/paintings.csv`

One row per painting needing updates, columns exactly:
`slug` (must match `paintings.slug`), `physical_size` (free text, e.g. `24 x 36` — inches assumed, width first), `availability` (`Available` / `Sold` / free text), `location`, `series`, `notes`. Blank cells mean "no change." The 528 current slugs are exported for the operator by `scripts/export-catalog-csv.ts` (R4) so the sheet starts pre-filled.

### 7.3 Ingest — `scripts/ingest-content.ts` (R4)

Reads both CSVs. For murals: overwrites the placeholder fields in `mural-data.ts` (it's checked-in code — the script rewrites the literal and the un-suppression of names/years in §4.4 happens by data presence, not code change). For paintings: parses `physical_size` into `width_in`/`height_in` (accepting `24x36`, `24 x 36`, `24" x 36"`, `24in x 36in`; anything else goes to the error report, never guessed), updates availability/location/series/notes. Always: `--dry-run` prints the full change plan; the real run requires `--apply`; every run writes `docs/intake/ingest-report-<date>.md` (rows applied, rows skipped + why). Runs against production only from the operator's machine per the OPERATOR-GUIDE R4 ritual, after a backup.

### 7.4 Publication

Content changes in the DB are invisible until redeploy (§2). The R4 ritual ends: verify on a Vercel preview deploy → operator merges → production deploy. That deploy is the "publish" button.

---

## 8. Email Contract

- **Transport:** Resend. Free tier: 100/day, 3,000/month — generous for gallery scale; if the trail outgrows it, that's a pricing decision for the operator, not an engineering change.
- **Kinds:** (1) Auth.js magic link (automatic); (2) redemption code to the user; (3) completion notification to `GALLERY_EMAIL`. All "from" `EMAIL_FROM`.
- **Go-live cutover (R5):** verify `byrachelpierce.com` in Resend (SPF + DKIM records — the operator has DNS control), then `EMAIL_FROM=trail@byrachelpierce.com`, `GALLERY_EMAIL=` the real gallery inbox. Until then the Resend test domain only delivers to the account owner's own address — this is why trail emails "don't arrive" for other testers; it's a Resend restriction, not a bug (troubleshooting table, OPERATOR-GUIDE).
- **Tests never send real email.** `resend` is mocked in unit/integration tests; Playwright runs with `RESEND_API_KEY` unset and asserts on the mock/log side only (Spec §4.5).
- Email HTML stays inline-styled, table-based, no external images (email-client reality). Brand hexes are hardcoded in templates by necessity — this is the **one sanctioned exception** to the tokens-only rule, and templates carry a comment saying so.

## 9. Auth Contract

Auth.js v5 (`next-auth@5.0.0-beta.25`) + Resend provider + Drizzle adapter, **database** session strategy (required for email providers), session callback exposing `session.user.id`. This is working and correct — R1 does not restructure it.

- The beta version is **pinned exactly** (no `^`) in R0 and recorded in the committed lockfile. Upgrading it is an escalation, not a chore task: adapter shape expectations have broken this project twice already (see commits `a56ef3b`, `2f9d377`).
- `AUTH_SECRET` is production-strength and set in Vercel (R5 checklist).
- Sign-out flows through the CSRF-token dance in `TrailClient.handleSignOut` — Auth.js requires it; don't simplify it away.

## 10. Security & Secrets Rules

1. **Secrets never enter the repo.** Precedent: a live Resend key was committed in the v1 trail spec (leaked, rotation mandatory — Operator Phase 0.1); a live Turso read-write token sat in a plaintext `Database Token.txt` beside the repo (deleted + rotated in Phase 0.1). Env vars live in `.env.local` (gitignored) and the Vercel dashboard, nowhere else. Any secret that touches git history is rotated, not scrubbed-and-hoped.
2. All user input is validated at the API boundary (the checkin route's pattern is the template). All DB access goes through Drizzle's parameterized builders — raw SQL string interpolation is forbidden (the one `sql\`\`` template in `art-service.ts` interpolates only column refs and a numeric id; keep it that way).
3. Auth pages/endpooints aside, the site has no user-generated content and no payment surface; the threat model is correspondingly small. Do not add attack surface (uploads, comments, webhooks) without a DECISIONS entry.
4. Dependency CVEs: Dependabot/Vercel security PRs (like the `vercel/react-server-components-cve-*` branch) are triaged within one milestone, not left on the remote.

## 11. SEO, Analytics & Go-Live Baseline (R5)

- `sitemap.ts` and `robots.ts` (App Router conventions) — all public pages + all painting pages; trail status/API routes disallowed.
- Per-page `metadata` already exists; R5 verifies every public page has a unique title/description and real OG images (painting pages already do via `webImagePath`).
- Redirect map from the old Wix URLs (operator supplies the top Wix page URLs during R5 — a 10-minute task listed in the OPERATOR-GUIDE) → `next.config.ts` `redirects()`.
- Analytics: **Vercel Analytics** (privacy-friendly, zero-config, free tier) — no cookie banner needed since no cross-site tracking. GA4 was rejected (consent UX cost > insight value at gallery scale) — DECISIONS 011.
- Lighthouse budget on `/`, `/collection`, one painting page, `/murals/trail`: Performance ≥ 85 mobile, Accessibility ≥ 95, SEO ≥ 95 (gated in R5, measured via `unlighthouse`/`lighthouse-ci` in the gate command table).

---

## 12. Design Language

This is the complete visual contract. Build models: do not invent styles; compose these. The existing `globals.css` `@theme` block is the token source of truth — this section makes its *usage* normative and fills the judgment gaps.

### 12.1 Brand voice in one paragraph

Island-bright, painterly, unhurried. Teal is the brand's water; coral is its call to action; hot pink is a wink, never a shout. Generous whitespace, serif headlines with italic accents, wide-tracked uppercase micro-labels. The art is the hero: chrome recedes, imagery leads. Nothing corporate, nothing dark-mode, nothing techy.

### 12.2 Color tokens (existing — usage rules added)

| Token | Hex | Use | Never |
|---|---|---|---|
| `--color-teal` `#36b5cd` | Header/footer ground, section grounds, links, markers | Body text (contrast fails on white) |
| `--color-teal-dark` `#2a9ab0` | Text on `teal-light`, hover on teal grounds | — |
| `--color-teal-light` `#e8f7fb` | Tinted panels, badges, selection | Text |
| `--color-coral` `#fd8473` | **The** CTA color: primary buttons, key links | Large area fills; more than one primary CTA per view |
| `--color-coral-dark` `#e86b59` | Coral hover | — |
| `--color-hotpink` `#ff008c` | Hover accents, tiny highlights | Resting-state anything; body text |
| `--color-slate` `#577083` | Body text | — |
| `--color-slate-light` `#8099aa` | Meta text, captions | Text under 14px on offwhite (contrast) |
| `--color-slate-dark` `#3d5264` | Headings | — |
| `--color-white` / `--color-offwhite` `#fafaf8` | Page / alternating section grounds | — |
| `--color-border` `#e8edf0` | Hairlines, card borders | — |

Every color in the UI is one of these tokens. New hex values require a DECISIONS entry. (Email templates: §8 exception.)

### 12.3 Typography

- **Playfair Display** (`--font-heading`): all headings; italic for emotional subheads ("See how art looks on your wall…"). Weight 700 headings, 400-italic subheads.
- **Jura** (`--font-nav`): navigation, buttons, badges, micro-labels — always with `letter-spacing: 0.04em–0.14em`, uppercase for labels ≤ 13px.
- **System body stack** (`--font-body`): all body copy, `line-height ≥ 1.55`.
- The fluid `--text-xs…5xl` clamp scale is the only sizing vocabulary. Page H1 = `--text-4xl` (`--text-5xl` on the home hero only). Card titles = `--text-base`–`lg`. Meta = `--text-xs`.
- Fonts load via `next/font` with `display: swap` (R3 verifies; if the current implementation links CSS instead, migrate).

### 12.4 Space, radius, elevation, motion

- Spacing: the 4px `--spacing-*` scale; section padding = `.section-pad` (`clamp(3rem, 7vw, 6rem)`); page gutter via `.container-site` (max 1200px).
- Radius: cards `--radius-lg`/`xl`; pills & buttons `--radius-full`; images inside cards inherit the card radius.
- Elevation: resting cards `--shadow-sm` or none + border; hover `--shadow-md` with `translateY(-3px)` (`.card-hover`); modals/popups `--shadow-lg`. Teal-tinted shadows are the brand signature — keep them.
- Motion: the three `--transition-*` tokens (120/180/320ms, expo-out curve). Hover = base; page-level reveals = slow. **No scroll-jacking, no parallax, no auto-playing motion**; respect `prefers-reduced-motion` by disabling transform transitions (R3 adds the media query to `globals.css` — currently missing).

### 12.5 Component recipes (canonical forms)

- **Primary button** (`.btn-coral`): coral ground, white Jura 600 text `--text-sm` ls 0.07em, 48px height, `--radius-full`, hover → coral-dark + lift 1px. One per view.
- **Secondary button** (`.btn-teal` / `.btn-ghost-teal`): teal solid → hotpink hover, or teal 1px-border ghost → teal-filled hover.
- **Badge**: `teal-light` ground, `teal-dark` Jura 700 uppercase `--text-xs` ls 0.14em, full radius, optional pulsing dot (the `/ar` page badge is the reference implementation).
- **Artwork card**: white ground, border hairline, `--radius-lg`, image top (aspect from DB px dims), title Playfair `--text-base`, medium as slate-light `--text-xs` meta, `.card-hover`. No price (site sells nothing).
- **Form input**: 48px height, `--radius-full`, white/near-white ground, teal-tinted 1px border, focus per the global `:focus-visible` (teal 2px outline, 3px offset).
- **Map marker/popup**: exactly as implemented in `globals.css` (`.mural-marker`, `.mural-popup-*`) — teal numbered pin, coral active state. Reference implementation, do not fork.
- **Touch targets ≥ 44px** everywhere (already a global rule — preserve it when adding components).

### 12.6 States & empty states

Loading = the `.img-placeholder` teal-gradient shimmer vocabulary (map loading skeleton is the reference). Empty states = centered: Playfair `--text-xl` line ("No paintings match those filters — yet."), one-sentence slate body, one ghost-teal action ("Clear filters" / "Browse everything"). Errors on user actions = inline `--text-sm` coral-dark text near the control, never an alert(); the trail check-in error pattern is the reference.

### 12.7 Copy voice

Warm, first-person-plural gallery voice ("We'd love to see your selfies"), contractions welcome, exclamation points rationed to celebrations (trail completion earns one). Sentence case everywhere except Jura micro-labels (uppercase). Tourist-plain language: "on your wall," never "in situ visualization." Error copy owns the problem ("Something went wrong on our end — try again in a moment"). Never fake urgency, never "limited time."

---

## 13. AR Sizing Tool — Build-Ready Specification (next release, specced now)

*"See how art looks on your wall before you buy."* Replaces the `/ar` coming-soon page. This section is complete enough for a Sonnet session to build without inventing; judgment calls are pre-made here.

### 13.1 Decision & constraints (settled)

**Approach: self-hosted, built on Google's open-source `<model-viewer>` web component** (Apache-2.0). Rationale, binding: the commercial art-viz SaaS category (ArtPlacer, Canvy, etc.) fails all three operator constraints — monthly subscription, image-rights entanglement in widget ToS, vendor branding/sales surface on our artwork. `<model-viewer>` has no vendor account, no fee, no branding, and images never leave our infrastructure. AR itself is delivered by the **platform-native viewers**: iOS AR Quick Look (Safari — the dominant tourist device) and Android Scene Viewer/WebXR. Our code is: a model-generation script + one page component + a 2D fallback.

### 13.2 Eligibility (hard gate, no exceptions)

A painting is AR-eligible iff `width_in` and `height_in` are both non-NULL (§3.3). **Never estimate physical size from pixel dimensions** — a wrong-sized preview is worse than none (Invariant 3). Ineligible paintings show no AR affordance at all. Launch reality: eligibility grows as R4+ content collection fills in dimensions; the tool ships correct-but-sparse rather than broad-but-lying.

### 13.3 Model pipeline — `scripts/generate-ar-models.ts`

For each eligible painting, generate one **GLB**:

- Geometry: a box `width_in × height_in × depth_in` (default depth 0.75" when NULL) in meters (`in × 0.0254`), origin centered, **Y-up, facing +Z**, so wall placement orients correctly in Quick Look/Scene Viewer.
- Material: front face textured with the painting's web image downscaled to ≤ 2048px longest edge (JPEG, quality 80); sides and back flat `#f5f2ec` "canvas edge" color; `roughness 0.9, metallic 0` (matte canvas, no glare).
- Authoring library: `@gltf-transform/core` (+ `@gltf-transform/functions`) — pure Node, no headless GL, deterministic output. This is the sanctioned new dev-dependency for the AR milestone.
- Output: `ar-models/<slug>.glb`, uploaded to Vercel Blob under `ar/` by the same sync pattern as §6. **Budget: ≤ 2.5MB per GLB** (texture-dominated; 2048px q80 JPEG ≈ 600KB typical — headroom is deliberate).
- iOS USDZ: **not pregenerated.** `<model-viewer>` converts GLB → USDZ on-device for Quick Look when no `ios-src` is given. Acceptance testing on the physical iPhone (§13.6) validates quality; **escalation trigger:** if on-device conversion renders wrong scale or broken texture on iPhone, stop and write up — the fallback plan (pregenerate USDZ via Apple's `usd_from_gltf` toolchain) is an operator decision because it adds a macOS/toolchain dependency.

### 13.4 UI behavior

- Painting detail page (eligible works only): a **"View on your wall"** secondary button (ghost-teal recipe, §12.5) under the size line. Tapping lazy-loads (dynamic import, client component) a `<model-viewer>` block: `ar`, `ar-modes="webxr scene-viewer quick-look"`, `ar-placement="wall"`, `ar-scale="fixed"` (**true scale is the whole product — pinch-scaling is disabled**), `camera-controls` for the 3D preview, painting thumb as `poster`.
- Device support detection: if `model-viewer` reports AR unavailable (desktop, older devices), the same button opens the **2D room preview** instead: a modal compositing the painting at scale against a bundled reference wall photo with a sofa of stated width (84") — pure CSS/`<canvas>` scaling from `width_in`, caption "Shown to scale against an 84-inch sofa." One reference room image, brand-shot or CC0, chosen by the operator from three candidates the build session prepares (operator step in that milestone's ritual).
- The `/ar` page converts from coming-soon to a short explainer + entry points into eligible paintings (grid reusing the artwork card). The disabled email-capture UI on it is removed (superseded by the launch; email list is Appendix A.4).
- Accessibility: the AR flow is an enhancement; all painting information remains readable without it. Buttons carry `aria-label`s; the 2D modal traps focus and closes on Esc.

### 13.5 Performance contract

`@google/model-viewer` (~300KB) loads **only** on user intent (button tap), never in the initial bundle of any page; GLBs stream from Blob on demand. Painting-page Lighthouse scores (§11) must be unchanged with the feature merged — measured in the milestone gate.

### 13.6 Acceptance (written now so the future milestone inherits real gates)

1. `npm run ar:generate -- --slug <known-test-slug>` produces a GLB < 2.5MB; `npx @gltf-transform/cli validate` passes.
2. Physical-device matrix (operator, checklist in OPERATOR-GUIDE): iPhone Safari → Quick Look opens, painting mounts on a **wall** (not floor), measured width of a known painting against a tape measure within ±5%; Android Chrome → same via Scene Viewer/WebXR; desktop → 2D fallback renders with correct relative scale.
3. Ineligible painting shows no AR button (automated test).
4. Playwright: button lazy-loads the component; initial-load JS budget unchanged (request accounting).

---

## 14. Changelog — v1 → v2 Amendments

| # | Change | Class |
|---|---|---|
| 1 | Storage architecture rewritten to match reality: Turso + Drizzle (v1 said unstorage/filesystem; code moved on before archive) | doc-drift fix |
| 2 | `trail_completions` table replaces the `mural_id: 0` sentinel-row mechanism; status counts murals 1–14 only; migration + cleanup defined | **design-hole fix (audit hole 1)** |
| 3 | Redemption codes: CSPRNG + unambiguous 31-char alphabet; `BRP-` prefix canonicalized (v1 said `RP-`) | **design-hole fix (audit hole 2)** |
| 4 | Completion race eliminated via PK/`ON CONFLICT` semantics; single-sender email rule | **design-hole fix (audit hole 3)** |
| 5 | Email fidelity: real check-in timestamps, templated required-count | **design-hole fix (audit hole 4)** |
| 6 | Rendering contract defined; collection list/category pages become dynamic (SSG + searchParams conflict resolved); build-time DB dependency documented with CI file-DB rule | new contract |
| 7 | Image pipeline: Vercel Blob + `next/image` + budgets; `public/art/` leaves git | new contract |
| 8 | Content honesty rules: fabricated mural names/years suppressed until real content; unknown availability shows no claim | new contract |
| 9 | Content intake pipeline (`docs/intake/` CSVs + ingest script) defined | new contract |
| 10 | Design language written (§12); AR tool fully specified (§13) | judgment capture |
| 11 | Security rules formalized after two live-secret findings | new contract |

## Appendix A — Deferred Features Audit

Every feature seen in code, docs, or conversation that is **not** in this release, with a recommendation. "Next" = good v-next candidate; "Drop" = recommend never.

| Id | Feature | Where it appears | Recommendation |
|---|---|---|---|
| A.1 | **AR Sizing Tool** | `/ar` page, this doc §13 | **Next — first in line.** Fully specced; gated only on dimension data, which R4 starts collecting. |
| A.2 | Per-mural detail pages (photo, story, map deep-link) | implied by trail | Next. Cheap after R4 supplies real content; strengthens the trail's SEO surface. |
| A.3 | Redemption tracking UI (mark code redeemed at register) | `redeemedAt` column (§3.2) | Next. Schema ships in R1 (zero marginal cost); a cashier-friendly page is a small, well-bounded feature. |
| A.4 | Email list / newsletter capture | dormant `email_list` table; removed `/ar` signup UI | Next, only with a concrete sending plan (who writes the newsletter?). Capture without sending is liability, not value. |
| A.5 | Contact form backend | `/contact` page UI | Next. Resend-powered, small. Until then the page must show direct contact details rather than a dead form (R3 checks this). |
| A.6 | Trail admin/stats view (completions, check-in heatmap) | operator wish, gallery email is the current "dashboard" | Next, if trail volume justifies it. SQL-over-Turso-CLI suffices meanwhile (queries provided in OPERATOR-GUIDE). |
| A.7 | Geofenced check-ins | v1 spec explicitly rejected | **Drop.** Contradicts the design philosophy; adds permission friction for zero fraud value (redemption is in-person anyway). |
| A.8 | On-site e-commerce/cart | README "no e-commerce" | **Drop** for this site. Lightspeed owns transactions; revisit only as a business decision. |
| A.9 | Search relevance upgrades (FTS5, typo tolerance) | `LIKE` search (§5.1) | Next-next. `LIKE` is adequate at 528 works; FTS5 is available in libSQL when the catalog or the analytics say otherwise. |
| A.10 | Image zoom / lightbox on painting pages | none yet | Next. Pairs naturally with A.1; keep to a CSS/dialog implementation, no heavy gallery lib. |
| A.11 | CMS for paintings (admin CRUD UI) | implied by content workflow | Defer indefinitely. The CSV-ingest pipeline (§7) is the right weight for a two-person operation; a CMS is a maintenance liability here. |

# by Rachel Pierce — byrachelpierce.com

Marketing and experience website for the **by Rachel Pierce** art gallery on Sanibel Island, Florida (1571 Periwinkle Way). Presents Rachel's 528-painting collection, her 14 island murals, and the gamified **Mural Selfie Trail**. This is a marketing site — e-commerce lives on an external Lightspeed shop.

## Governing documents

| Doc                                                            | What it is                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`docs/SITE-ARCHITECTURE-v2.md`](docs/SITE-ARCHITECTURE-v2.md) | Behavior contract: what every feature does (incl. design language §12 and the AR tool spec §13) |
| [`docs/FINAL-BUILD-SPEC.md`](docs/FINAL-BUILD-SPEC.md)         | Process contract: milestones R0–R5, quality gates, CI, engineering rules                        |
| [`OPERATOR-GUIDE.md`](OPERATOR-GUIDE.md)                       | The supervising human's runbook                                                                 |
| [`CLAUDE.md`](CLAUDE.md)                                       | Standing orders for Claude Code build sessions                                                  |
| [`PROGRESS.md`](PROGRESS.md) / [`DECISIONS.md`](DECISIONS.md)  | Live state · judgment-call log                                                                  |

## Tech stack

- **Next.js 15** (App Router, React 19) · **TypeScript** (strict) · **Tailwind CSS v4** (CSS-first `@theme` tokens in `src/app/globals.css`)
- **Turso** (libSQL/SQLite) via **Drizzle ORM** — auth, trail, and painting catalog. The production DB is live; see Spec §3 rule 1 before touching anything.
- **Auth.js v5** (pinned beta) + **Resend** magic-link email · **Leaflet** mural map · **Vercel** hosting (+ Blob for art images from R2)

## Quickstart (local, no cloud credentials needed)

```powershell
npm ci
# .env.local minimum for local dev:
#   TURSO_DATABASE_URL=file:./dev.db
#   AUTH_SECRET=<any random string locally>
#   NEXTAUTH_URL=http://localhost:3000
npm run db:seed-ci        # builds + seeds a local file DB (available from R0)
npm run dev               # http://localhost:3000
```

Full commands (available from R0): `npm run check` (lint+format+types+tests) · `npm run test:coverage` · `npm run e2e` (R3+) · gate details in Spec §4.1.

## Repo map

```
src/app/            App Router pages (/collection, /murals/trail, /ar, marketing pages)
src/app/api/        Route handlers: auth ([...nextauth]), trail (checkin, status)
src/components/     UI (collection/, trail/, map, chrome)
src/lib/            Services: art-service, trail-service, trail-emails, mural-data, constants
src/db/             Drizzle schema + client (Turso / file: DBs)
scripts/            Data pipelines (art extraction/migration; ingest + blob sync arrive R2/R4)
docs/               Specification documents (agent-read-only; docs/intake/ = operator content drop zone)
public/art/         Art images — gitignored; served from Vercel Blob in production (Architecture §6)
```

## Brand at a glance

Teal `#36b5cd` ground · coral `#fd8473` CTAs · hot-pink hover accents · Playfair Display headings · Jura labels. The complete design language — tokens, type, component recipes, motion, copy voice — is Architecture §12 and is normative.

## External

Shop: https://store33134078.company.site/ · Instagram [@by_rachelpierce](https://www.instagram.com/by_rachelpierce/) · sister businesses: [Pierce's Paw Paradise](https://www.piercespawparadise.com), [Home by Rachel Pierce](https://www.homebyrachelpierce.com)

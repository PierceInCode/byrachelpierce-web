# PROGRESS — byrachelpierce-web

> The agent updates this at the end of EVERY session. The operator verifies it before /clear.

## Milestone status (plan: `docs/FINAL-BUILD-SPEC.md`)

- [ ] **Phase 0** (operator): secrets rotated (Resend + Turso), `Database Token.txt` deleted, branch protection, planning PR merged + `planning-docs` tag, harness verified, art folder backed up, Vercel previews confirmed
- [ ] R0 process retrofit — branch `r0-process` — gate: Spec §5.2
- [ ] R1 trail correctness — `r1-trail` — gate: Spec §6.2 (incl. operator-run production migration)
- [ ] R2 images & performance — `r2-images` — gate: Spec §7.2
- [ ] R3 collection finish — `r3-collection` — gate: Spec §8.2
- [ ] R4 content intake — `r4-content` — gate: Spec §9.2 (murals content gates R5)
- [ ] R5 go-live — `r5-golive` — gate: Spec §10.2 + smoke matrix → tag `v1.0.0`

## True current state (2026-07-03, planning session)

- **Tests: none exist yet.** Tooling gates (lint/format/vitest/CI) arrive in R0. `npx tsc --noEmit` passes; `npm run build` passes (552 pages, needs DB env).
- **Stranded, deliberately uncommitted work** (lands in R0 step 1, NOT before): the June art-collection feature — modified: `package.json`, `tsconfig.json`, `next-env.d.ts`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/collection/page.tsx`, `src/app/collection/[category]/page.tsx`, `src/db/schema.ts`, `src/lib/constants.ts`, `src/types/index.ts`; untracked: `package-lock.json`, `scripts/`, `src/app/collection/painting/`, `src/components/collection/`, `src/lib/art-service.ts` (+ `public/art/` — now gitignored, never to be committed).
- Local `main` is 1 commit behind `origin/main` (`525b611`, the Next.js 15.3.6 CVE fix) — reconciled in R0 step 2.
- Known live defects (fixed in R1, documented in Architecture §4.2): sentinel-row status inflation after trail completion; `Math.random` codes with ambiguous characters; completion race; wrong timestamps in gallery email. Mural names/descriptions/years on public pages are fabricated placeholders (Architecture §4.4; real content in R4).
- Data reality: 0/528 paintings have physical size, 1/528 has availability. Leaked secrets: Resend key (in git history) + Turso token (plaintext file) — rotation is Phase 0.1 and is NOT yet done as of this writing.
- Planning docs written on branch `final-product-planning`: Architecture v2, FINAL-BUILD-SPEC, CLAUDE.md, agent harness (hooks piped-payload tested), OPERATOR-GUIDE, this file, DECISIONS.md 001–012, README rewrite. Old trail spec archived to `docs/old/` (leaked key redacted).

## Exact next step

1. Operator: OPERATOR-GUIDE **Phase 0.1 (rotate secrets) — before anything else**, then 0.2–0.7, ruling on DECISIONS 001–012 in the planning PR.
2. Then start **R0** in a fresh Sonnet 5 session: prompt bank "Start a milestone" with n=0.

## Open questions for operator

- None blocking beyond the DECISIONS veto points (007 — suppressing fabricated mural content pre-R4 — is the one that changes visible behavior; read it deliberately).

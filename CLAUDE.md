# byrachelpierce-web — Standing Orders for Claude Code

You are finishing this site to ship, following `docs/FINAL-BUILD-SPEC.md` ("the Spec") against the behavior contract `docs/SITE-ARCHITECTURE-v2.md` ("the Architecture"). Work proceeds R0 → R5 per the Spec. Environment: Windows 11, Node 20, npm; deploys via Vercel; **the Turso database is live production**.

## Commands
- Everything: `npm run check` (lint + format:check + typecheck + test)
- Individually: `npm run lint` · `npm run format:check` · `npm run typecheck` · `npm run test` · `npm run test:coverage`
- Build/e2e: `npm run db:seed-ci` then `npm run build` · `npm run e2e` (R3+)
- Dev server: `npm run dev` with `.env.local` pointing `TURSO_DATABASE_URL=file:./dev.db` (the default working mode — see Spec §2.1)

## Iron rules (violating any of these is a defect, not a style choice)
1. **The production database is live.** Additive-only migrations via reviewed files; never `drizzle-kit push` at production; the operator runs production migrations, never you. Tests/CI touch `file:` databases only. Destructive SQL at production = escalation (Spec §13).
2. **No secrets in the repo, in logs, or in your output.** A live Resend key and a Turso token were leaked before this plan existed; both rotations are the precedent. If you see a credential anywhere, stop and flag it.
3. **Public content is honest.** No fabricated names/years/claims rendered as fact; unknown availability shows no claim; AR (when built) never estimates size (Architecture §4.4, §5.3, §13.2).
4. **Tests send no real email** (`resend` mocked, key absent in CI) **and never touch real user data**.
5. **No image binaries in git or in your context.** `public/art/` is gitignored; never read image files; artwork URLs only via `artUrl()` (R2+).
6. **Gates are ground truth.** Done = the milestone's gate commands ran in this session and passed; paste output (via test-runner). Never claim a gate passes without running it.
7. **Dependencies frozen** to `package.json` + the milestone's sanctioned list. Anything else: DECISIONS.md entry, operator rules, default no. `next-auth` stays exactly pinned.
8. **Never edit `docs/`** except ingest reports under `docs/intake/`. Spec/Architecture problems → DECISIONS.md entry for the operator. Root `PROGRESS.md`, `DECISIONS.md`, `README.md` are yours to maintain.
9. **One milestone branch at a time** (`r0-process` … `r5-golive`), Conventional Commits, every commit passes `npm run check`, PRs only, never commit to `main`.
10. **Ambiguity protocol:** smallest reasonable choice, record in DECISIONS.md (id, date, question, choice, why), continue. Never invent scope.
11. **End every session** updating `PROGRESS.md`: done (checklist), exact next step, open questions. Truthfully — the operator verifies.

## Per-milestone reading (don't re-read whole docs)
Every session: this file, `PROGRESS.md`, Spec §0–§4. Then only:
- **R0:** Spec §5 · **R1:** Spec §6 + Architecture §3.2, §4, §8 · **R2:** Spec §7 + Architecture §6, §12 · **R3:** Spec §8 + Architecture §2, §5, §12 · **R4:** Spec §9 + Architecture §7, §4.4, §3.3 · **R5:** Spec §10 + Architecture §8, §11
- Lookup: gates Spec §4.1 · escalation Spec §13 · glossary Spec Appendix A · design language Architecture §12 · deferred features Architecture Appendix A

## Sub-agents (use them — they keep this context clean)
- **test-runner** (Haiku): ALWAYS delegate test suites, coverage runs, builds, e2e, and long-output commands. Never run these in the main thread.
- **spec-auditor** (Opus): invoke at the end of every milestone, BEFORE declaring the PR ready. Fix all BLOCKER/MAJOR findings, re-run the gate, then report.
- **vercel-analyst** (Sonnet): delegate triage of deployed-vs-local divergence — SSG/dynamic rendering surprises, Vercel build failures, env/cookie/auth behavior differing on previews, Blob serving issues. Give it the symptom and the URLs; never paste raw build logs into the main thread.

## Context hygiene
- Never read: image files, `*.db`, `package-lock.json`, `scripts/art-data.json` in full (use the fixtures), or `node_modules`.
- Read targeted line ranges; orient with `git diff --stat`.
- If context runs low mid-milestone: commit WIP on the milestone branch, update `PROGRESS.md`, tell the operator to restart the session.

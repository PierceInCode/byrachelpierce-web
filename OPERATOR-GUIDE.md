# Operator's Guide — Shipping byrachelpierce.com with Claude Code

**Who this is for:** you, Matthew, supervising the build. The agent's standing orders are `CLAUDE.md`; milestone content is `docs/FINAL-BUILD-SPEC.md` ("the Spec"); behavior is `docs/SITE-ARCHITECTURE-v2.md` ("the Architecture"). This document is yours. Anywhere it says **YOU**, do it yourself — do not delegate that step to the agent.

**Feature-drift caveat:** Claude Code commands and config formats evolve. If anything below doesn't match what you see, trust https://docs.claude.com/en/docs/claude-code/overview and adjust the harness files (they're plain text).

**Models:** Opus 4.8, Sonnet 5, Haiku 4.5 (+ occasional Fable for escalation reviews). Per-milestone assignments: Spec §1.2 / §12; repeated in the Phase 1 table below.

---

## Phase 0 — One-time setup (~1–2 hours). Do these IN ORDER before any milestone.

**0.1 — Rotate the leaked secrets (YOU, first, before anything else).**
1. Resend dashboard → API Keys → revoke the key beginning `re_cQuXwBZ1` (leaked in the pre-repo trail-spec document trail; the full key is NOT in this repo's git history — sweep-verified 2026-07-07 — but it was exposed and must be rotated) → create a new key.
2. Turso dashboard → byrachelpierce database → rotate/revoke the auth token that was in `Database Token.txt` → create a new one.
3. Update `.env.local` with both new values. Confirm `npm run dev` + a magic-link send still work.
4. Delete `C:\Code\businessWebsites\byRachelPierce\Database Token.txt`.
5. When you later set up Vercel env vars (R5), use the NEW values.

**0.2 — Branch protection (YOU).** GitHub → `PierceInCode/byrachelpierce-web` → Settings → Branches → protect `main`: require a pull request before merging, require status checks, block force pushes. Until R0's first PR creates the CI check, the status-check list is empty — come back after R0's first push and require the `checks` job.

**0.3 — Merge the planning docs (YOU).** Push branch `final-product-planning`, open a PR, and read every document top-to-bottom once (this is the last time anyone reads them end-to-end). **Rule on `DECISIONS.md` entries 001–012** — merging is your approval of them. Entries flagged ⚠ VETO POINT deserve a deliberate look. Then merge and tag:
```powershell
git checkout main; git pull; git tag planning-docs; git push --tags
```
Note: the stranded collection work stays uncommitted in your working tree through this merge — that is intentional; it lands in R0 step 1, not before.

**0.4 — Verify the harness loaded (YOU).** Start `claude` in the repo root. Confirm agents `test-runner`, `spec-auditor`, `vercel-analyst` are available and the hooks registered. Live test: ask the agent to edit `docs/FINAL-BUILD-SPEC.md` — it must be blocked by the guard hook and offer a DECISIONS.md entry instead. Then ask it to write `docs/intake/hook-test.md` — that must succeed (delete the file after).

**0.5 — Permissions policy (YOU — your safety rail).** Default ask-before-acting. **Never** `--dangerously-skip-permissions`. "Always allow" ONLY for: `npm run lint/format:check/typecheck/test/test:coverage/check`, `npx tsc`, `npx vitest`, file edits inside the repo, `git status/diff/log/add/commit/checkout -b`. Keep one-time approval for: `git push`, `npm install`/anything touching `package.json` deps, `drizzle-kit` anything, `npx tsx scripts/*` (the scripts touch DBs and Blob), anything network-touching, anything outside the repo.

**0.6 — Back up the art (YOU).** `public/art/` (205MB) is now gitignored — git does not protect it. Copy the folder to your backup location of choice (external drive / cloud). This is the master copy until R2 puts it in Vercel Blob (and even then, keep the local + backup copies — Blob is serving infrastructure, not archival).

**0.7 — Vercel sanity (YOU).** Vercel dashboard → confirm the project builds from the GitHub repo and PRs get preview URLs. Don't change env vars yet (R5 owns that); just confirm previews exist.

---

## Phase 1 — The per-milestone ritual (repeat for R0 → R5)

Run **one milestone per session family**. Don't batch milestones. Fresh context + hard gates is the reliability model.

| Milestone | Model | Sub-agents expected | Special handling |
|---|---|---|---|
| R0 process retrofit | Sonnet 5 | test-runner | §R0 below (stranded work) |
| **R1 trail fixes** | **Opus 4.8** | test-runner, spec-auditor | **§R1 below (live-DB migration)** |
| R2 images | Sonnet 5 | test-runner, vercel-analyst | §R2 below (Blob sync is yours) |
| R3 collection | Sonnet 5 | test-runner, vercel-analyst, spec-auditor | verify filters YOURSELF on the preview |
| R4 content intake | Haiku 4.5 / Sonnet 5 | test-runner | §R4 below (CSVs + production apply) |
| **R5 go-live** | **Opus 4.8** | all three | **§R5 below (DNS cutover runbook)** |

### The ritual

1. **Start clean (YOU):** `git status` must be clean (exception: pre-R0, the stranded work is expected); `git checkout main; git pull`. Start `claude`, set the milestone's model.
2. **Plan mode:** `claude` in plan mode → prompt from the Prompt Bank below → **read the plan**. Judge it against the milestone section yourself: does it list the same work items? Does it end at the gate? Reject scope creep.
3. **Supervised execution:** approve the plan; watch permission prompts (Phase 0.5 policy). The agent should delegate test runs to test-runner.
4. **Gates:** agent runs the milestone gate (via test-runner, output pasted). Then **YOU independently re-run** the gate commands from the Spec's milestone section in your own terminal. Not optional — this is the step that catches "described as passing."
5. **Auditor:** tell the agent: *"Run spec-auditor for R<n> and fix all BLOCKER/MAJOR findings, then re-run the gate."*
6. **PR:** agent opens it; **YOU read the diff** — every file. Small enough per milestone to be readable; if it isn't, that's itself a finding.
7. **Merge, tag, clear:** merge on green CI, `git tag r<n> && git push --tags`, verify `PROGRESS.md` was updated truthfully, `/clear` the session.

### Verification-command table (what YOU re-run per milestone)

| After | Commands (from repo root) | Expect |
|---|---|---|
| R0 | `npm run check`; `npm run test:coverage`; `npm run db:seed-ci; npm run build`; `git diff main --stat -- public/art` | all green; empty art diff |
| R1 | `npm run check`; `npx vitest run tests/trail`; the two SQL checks in Spec §6.2 against production (Turso shell) | green; 0 sentinel rows |
| R2 | `npm run check`; `npx tsx scripts/sync-art-blob.ts --dry-run`; phone-check the preview | green; images from Blob host |
| R3 | `npm run check`; `npm run e2e`; then filter/search/paginate ON THE PREVIEW yourself | results actually change |
| R4 | `npx tsx scripts/ingest-content.ts --dry-run`; spot-check 5 paintings + all 14 mural names on preview | real content |
| R5 | `npm run e2e`; `npm run lighthouse`; smoke matrix (§R5) | budgets green; matrix all-checked |

---

## Special handling — the dangerous milestones

### §R0 — Stranded work
The June collection feature (10 modified + 6 untracked paths) gets committed **as-is, no fixes** (landing ≠ reviewing; R3 reviews). Before approving R0's first commits, glance at `git status` yourself: the staged set must NOT include anything under `public/art/`. If the agent proposes "improving" the collection code during R0, refuse — that's R3.

Baseline migration note: R0 generates `drizzle/0000_*.sql` from the current schema. Production already has these tables. The agent will give you a one-time command to mark the baseline as applied against production (drizzle's baseline procedure) — run it yourself, and take a backup first (§R1 backup command).

### §R1 — Live database migration (the release's scariest step)
The migration creates `trail_completions`, copies legacy code rows, deletes sentinel rows. **YOU run it, not the agent:**
1. Backup: `turso db shell byrachelpierce ".dump" > backups/pre-r1-$(Get-Date -Format yyyy-MM-dd).sql` — verify the file is non-trivially sized before proceeding.
2. Record the expected counts (the runbook the agent prepares in the PR gives the exact queries): number of `mural_id = 0` rows = expected `trail_completions` rows.
3. Apply: `npx drizzle-kit migrate` with `.env.local` pointed at production (the ONLY sanctioned use of `drizzle-kit` against production in this release).
4. Run the Spec §6.2 verification SQL. Counts must match exactly. If they don't: STOP, restore is `turso db shell` + the dump file; then make the agent investigate — do not improvise SQL.
5. Do a real trail completion on the preview (your own email) and confirm "N/3" stays correct after reload.

### §R2 — Blob sync
The real upload needs the Blob read-write token — keep it out of `.env.local` history the agent sees if you prefer; run `npx tsx scripts/sync-art-blob.ts` yourself after reviewing the `--dry-run` plan. 1,056 files, one-time, idempotent (re-running is safe).

### §R4 — Content
Start filling `docs/intake/murals.csv` and `paintings.csv` with Rachel **as soon as R4 publishes the formats** (don't wait for the code to finish — the CSVs are the long pole). Murals block go-live; painting data doesn't (unknowns render honestly). Production apply = backup first (same command as §R1 step 1), then `--dry-run`, read the report, then `--apply`.

### §R5 — DNS cutover runbook
1. Day before: at the DNS host, lower TTL on the apex + www records to 300.
2. Verify production env vars in Vercel (Spec §10.1 item 5 checklist) and that the production deploy is green **before** touching DNS.
3. Resend: verify byrachelpierce.com (SPF + DKIM records) — do this before cutover day; propagation is slow.
4. Cutover: point apex + www at Vercel (dashboard gives exact records). Wait for cert issuance.
5. Smoke matrix (print this, check boxes, initial it, paste into the PR):
   - [ ] Every nav item loads over https://byrachelpierce.com (phone + desktop)
   - [ ] www → apex redirect
   - [ ] Collection: filter, search, paginate — results change
   - [ ] A painting page renders with image (from Blob) + correct availability
   - [ ] Trail: magic link round-trip on a phone, to an inbox that is NOT your Resend account email
   - [ ] Complete a check-in; gallery email arrives with real mural names + timestamps
   - [ ] Old Wix URLs redirect (spot-check 3)
   - [ ] `curl -sI https://byrachelpierce.com` → 200, served by Vercel
6. **Rollback if needed:** repoint DNS at the old Wix records (you lowered TTL, so ≤5 min propagation). Nothing else to undo — Wix keeps running until you cancel it. Don't cancel Wix until a week of green.

---

## Red flags — stop the session and investigate if the agent…

- proposes `drizzle-kit push`, raw SQL, or ANY write against production Turso
- asks for, echoes, or writes any secret value anywhere
- wants to lower a coverage threshold, disable a lint rule, skip a gate, or "temporarily" bypass CI
- edits under `docs/` (the hook should block it — if it got through, the hook broke)
- proposes committing `public/art/`, `.env.local`, or a `.db` file
- describes a gate as passing without pasted command output
- wants a new dependency not on the milestone's sanctioned list
- claims work is done but `PROGRESS.md` says otherwise (or vice versa)

## Troubleshooting

| Symptom | Likely cause | Do |
|---|---|---|
| Trail emails never arrive (pre-R5) | Resend test domain only delivers to YOUR account email | Expected. Test with your own address; real addresses work after R5 domain verification |
| Magic link works locally, not on preview | `NEXTAUTH_URL`/cookie config vs. preview URL | Have vercel-analyst triage; don't let the agent restructure auth |
| Filters/pagination do nothing on deployed site | The SSG/searchParams conflict (pre-R3) | Known defect; R3 fixes it. Don't hotfix |
| Images 404 on previews (post-R0, pre-R2) | Art is gitignored, Blob not yet synced | Expected until R2's sync runs |
| Vercel build fails, local passes | Env vars / prod schema drift | vercel-analyst; check dashboard env vars first |
| `npm run build` fails locally about DB | Forgot `npm run db:seed-ci` / `.env.local` points nowhere | Seed, or set `TURSO_DATABASE_URL=file:./dev.db` |
| Hook seems inactive | settings not loaded / `node` not on PATH | Restart `claude` in repo root; `node .claude/hooks/guard-docs.mjs` manually with a test payload (Phase 0.4) |
| Agent context degrading mid-milestone | long session | Have it commit WIP + update PROGRESS.md, then /clear and resume |

## Prompt bank (copy-paste)

- **Start a milestone:** `Read CLAUDE.md, PROGRESS.md, and Spec §0–§4, then the R<n> section and its Architecture reading list. Produce a plan for R<n> only — work items in dependency order, ending at the gate. Do not start work until I approve.`
- **Mid-milestone resume:** `Read CLAUDE.md and PROGRESS.md. Continue R<n> from the exact next step recorded there. Do not re-plan completed work.`
- **Gate run:** `Run the R<n> gate via test-runner and paste the output. If anything is red, fix and re-run; do not summarize a red gate as "mostly passing".`
- **Audit:** `Run spec-auditor for R<n>. Fix all BLOCKER and MAJOR findings, re-run the gate, then report findings + resolutions.`
- **Deployed-vs-local issue:** `Delegate to vercel-analyst: symptom is <X> on <preview URL>, works locally. Report its diagnosis before changing anything.`
- **Session end:** `Update PROGRESS.md truthfully (done / exact next step / open questions), commit it, and stop.`
- **Escalation received:** `You flagged an escalation. Write the full write-up into DECISIONS.md as an OPEN entry with options and your recommendation, update PROGRESS.md, and stop.`

## Standing queries (until A.6 ships) — trail stats from your terminal

```powershell
turso db shell byrachelpierce "SELECT COUNT(*) FROM trail_completions;"                          # completions
turso db shell byrachelpierce "SELECT mural_id, COUNT(*) FROM trail_progress GROUP BY mural_id ORDER BY 2 DESC;"  # popularity
turso db shell byrachelpierce "SELECT u.email, c.redemption_code, c.completed_at FROM trail_completions c JOIN users u ON u.id = c.user_id ORDER BY c.completed_at DESC LIMIT 20;"
```

⚠ **Audit note (2026-07-06):** the `turso` cloud CLI is NOT installed on this machine (only the local `tursodb.exe`), so the three queries above and the §R1 `.dump` backup command do not run as written. Until you install the CLI, use the libsql path: backups via `npx tsx scripts/backup-prod.ts` (arrives in M0), ad-hoc reads via the same `@libsql/client` pattern. See `TAKEOVER-AUDIT-2026-07-06.md` F6.

---

# Chuck takeover addendum (2026-07-06)

Everything above is the original R0–R5 operator guide and remains valid — M0–M3 of the takeover run wrap it rather than replace it (`BUILD-SPEC.md` maps the milestones; §R4/§R5 above are now protocols HT2/HT3 under `.chuck/human-tests/`). This addendum is the Chuck-run operating manual: your two gates, checkpoints, escalations, and the credential steps that are yours alone.

## Gate 1 — approve the plan

Nothing executes until you do this. Read three documents in this order:

1. **DECISIONS.md** — 15 judgment calls; every `VETO POINT: yes` is an explicit invitation to overrule (D4 branch model, D7 db:push guard, D8 read-only prod probes, D11 rotation timing, D12 file dispositions, and D15 — the plan-refutation resolutions — are the ones most worth your minute).
2. **BUILD-SPEC.md** — the four milestones and their exact acceptance gates. If a "done" you care about is not machine-checkable there, reject the plan.
3. **BUDGET.md** — estimate ranges and the overrun threshold.

Also worth reading once: `TAKEOVER-AUDIT-2026-07-06.md` §4 — the list of things you currently believe that are not true.

To send the plan back: state objections; `/chuck:plan` re-plans. To approve:

```powershell
New-Item -ItemType File .chuck/plan-approved
Set-Content .chuck/mode "checkpoint"   # or "continuous"
```

Approval write-protects BUILD-SPEC.md, DECISIONS.md (above the Amendments line), and the architecture doc; later changes go only through `/chuck:change`.

## Gate 2

The ship gate, at the end of M3. Milo assembles `ship-report.md`; you decide whether v1.0.0 stands.

1. Read **ship-report.md**: the whole-project coverage manifest (what was checked AND what was not), accumulated flags, and the known-gaps list — plus the executed HT3 smoke matrix.
2. Perform the operator credential steps it lists (they are yours alone — see Credentials below).
3. Approve to ship, or reject with objections to send specific items back. The `v1.0.0` tag and the final `main` merge are the ship action; nothing user-facing moves without this gate.

## Checkpoints

In checkpoint mode the run pauses after each milestone (M0 → M1 → M2 → M3). A clean checkpoint is a pause, not a question — Milquetoast writes `milestone-report.md`, reading it is optional, and silence is consent. Resume with `/chuck:run`. Each checkpoint here also carries one concrete operator action: merging the `chuck/integration` → `main` PR (which is the production deploy). A checkpoint only becomes a decision when it carries an escalation.

## Escalations

The run stops and asks you only when it genuinely cannot proceed; entries appear in `ESCALATIONS.md` and the run stays paused until you fill the entry's `**Answer:**` line, then resume with `/chuck:run`. The six types and your bounded action:

- **human-hands-needed** — run the named protocol (HT1 rotation, HT2 content loop, HT3 cutover) on your own schedule; return the result form to `.chuck/human-tests/HT<n>-result.md`.
- **irreversible-op** — anything touching production data or DNS beyond the approved rituals; you give explicit go-ahead or refuse.
- **blocked-gate / gate-3-strikes** — a gate stayed red through remediation; you adjudicate: accept as known gap, re-scope, or direct a fix.
- **budget-overrun** — actuals crossed BUDGET.md's threshold; raise it, approve the spend, or cut scope.
- **decision-gap / spec-amendment** — a choice isn't in DECISIONS.md or the plan must change; routes through `/chuck:change`'s mini-veto.
- **core-bet-failure** — not applicable to this run (no unproven core bets; the product is built and serving).

## Human-hands test protocols

Three are pre-written in `.chuck/human-tests/`: **HT1** (M0 — secret rotation + Phase-0 confirmations), **HT2** (M2 — the content loop with Rachel), **HT3** (M3 — DNS cutover + smoke matrix). Each is numbered steps a non-engineer could follow, with a result form; save the filled form at the path the protocol names and resume with `/chuck:run`. Batch them on your schedule — the run waits.

## Credentials

Operator-only material; agents never see, request, or store these — they escalate and wait:

- **Resend, Turso, Vercel, GitHub, DNS-host logins** — all dashboard actions (rotation, env vars, domain verification, DNS records) are yours.
- **Production env values** — you enter them in the Vercel dashboard (M3 checklist); agents verify outcomes only ever through public HTTP.
- **Production DB writes** — only through the backup-first ritual you authorize; the agent side is read-only probes (DECISIONS D8).
- One Wix task: supply (or approve the crawled) list of top Wix page URLs for the M1 redirect map — a 10-minute task.

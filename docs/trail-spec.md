# Mural Selfie Trail — Technical Specification
## by Rachel Pierce · byrachelpierce.com

**Date:** March 1, 2026  
**Status:** DRAFT — awaiting Matthew's review before implementation  
**Author:** Perplexity Computer  

---

## 1. Feature Summary

Users visit the Mural Selfie Trail page, enter their email to receive a magic link, then self-report check-ins at any 3 of the 14 mural locations on Sanibel Island. At each check-in, they are prompted (but not required) to post a selfie tagging @byrachelpierce on Instagram or Facebook. Upon completing 3 check-ins, the system automatically generates a unique redemption code and emails it to the user. The user shows this email to the cashier at the Rachel Pierce Art Gallery to claim a gift.

**Design philosophy:** This is marketing with fun — not a policed system. If someone games it, that's on them. The in-person redemption is the natural fraud gate.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (Client)                                           │
│                                                             │
│  /murals/trail ─── TrailPage (Server Component)             │
│       └── TrailClient (Client Component)                    │
│            ├── EmailSignInForm                              │
│            ├── TrailProgressTracker                         │
│            │    └── MuralCheckInCard (x14)                  │
│            ├── CompletionCelebration                        │
│            └── MuralMapWrapper (existing)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Server Actions / API Routes
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  NEXT.JS SERVER                                             │
│                                                             │
│  src/auth.ts ─── Auth.js v5 config                          │
│       ├── Resend provider (magic link emails)               │
│       └── Unstorage adapter (filesystem JSON — no DB)       │
│                                                             │
│  src/app/api/trail/checkin/route.ts ─── POST check-in       │
│  src/app/api/trail/status/route.ts  ─── GET  progress       │
│  src/lib/trail-service.ts ─── Business logic                │
│       ├── recordCheckIn(email, muralId)                     │
│       ├── getTrailProgress(email)                           │
│       └── generateRedemptionCode()                          │
│                                                             │
│  data/trail-progress/ ─── JSON files per user               │
│       └── {hashed-email}.json                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Resend API (free tier)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  RESEND                                                     │
│  - Magic link emails (Auth.js handles this automatically)   │
│  - Redemption code email (custom, sent via trail-service)   │
│  - Gallery notification email (sent alongside user email)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Decisions

### 3.1 Authentication: Auth.js v5 + Resend Provider

**Why Auth.js v5 (next-auth@beta):**
- Official Auth.js docs provide a first-party Resend provider with magic link support
  (source: https://authjs.dev/guides/configuring-resend)
- First-class Next.js App Router support with Server Actions
- Handles token generation, verification, and email sending out of the box
- The `AUTH_RESEND_KEY` env var is auto-detected — minimal config

**Setup:**
- `npm install next-auth@beta`
- Config file: `src/auth.ts`
- API route: `src/app/api/auth/[...nextauth]/route.ts`
- Env vars: `AUTH_RESEND_KEY`, `AUTH_SECRET`, `NEXTAUTH_URL`

**C# analogy:** Auth.js is like ASP.NET Identity — it provides the auth scaffolding (session management, token generation, provider abstraction) so you don't build it from scratch. The "Resend provider" is analogous to configuring an `IEmailSender` implementation in Identity.

### 3.2 Database: Unstorage Adapter (Filesystem)

**Why Unstorage with filesystem driver:**
- Auth.js email providers *require* a database adapter (for verification tokens)
  (source: https://authjs.dev/getting-started/providers/resend)
- Unstorage is Auth.js's official key-value adapter that supports multiple backends
  (source: https://authjs.dev/getting-started/adapters/unstorage)
- The filesystem driver writes JSON files to disk — zero external services, zero cost
- For a small-scale trail feature on Sanibel Island, this is perfectly adequate
- Easy to migrate to Redis, Vercel KV, or a real DB later if needed

**Trade-off acknowledged:** Filesystem storage doesn't scale horizontally (can't run multiple server instances). For this project's scale (a gallery on Sanibel Island), that's fine. When deploying to Vercel, we'll switch the Unstorage driver to Vercel KV (also free tier) since Vercel's serverless functions don't have persistent filesystem access.

**Setup:**
- `npm install unstorage @auth/unstorage-adapter`
- Driver: `fsLite` for local dev, `vercelKV` for production (env-based switch)

### 3.3 Trail Progress Storage

Trail progress (which murals a user has checked in to) is stored separately from Auth.js's user/session data, in simple JSON files:

```
data/trail-progress/{hashed-email}.json
```

**Schema per file:**
```json
{
  "email": "visitor@example.com",
  "checkIns": [
    { "muralId": 7, "timestamp": "2026-03-15T14:30:00Z" },
    { "muralId": 3, "timestamp": "2026-03-15T15:45:00Z" },
    { "muralId": 11, "timestamp": "2026-03-16T10:20:00Z" }
  ],
  "questComplete": true,
  "redemptionCode": "RP-7X3K9M",
  "completedAt": "2026-03-16T10:20:00Z"
}
```

**Why separate from Auth.js storage:**
- Auth.js manages users, sessions, and verification tokens — that's its concern
- Trail progress is business logic — keeping it separate is cleaner
- Makes it trivial to query, export, or migrate trail data independently

**C# analogy:** This is the "repository pattern" — Auth handles identity, a separate TrailService handles the domain logic and persists to its own store.

### 3.4 Redemption Code Format

Format: `RP-{6 random alphanumeric characters}`  
Example: `RP-7X3K9M`

- Prefix `RP` makes it obviously associated with Rachel Pierce
- 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I to avoid confusion)
- ~800 million possible codes — no collision risk at gallery scale
- Generated server-side with `crypto.getRandomValues()`

No database lookup needed at the register — the cashier just sees the email with the code.

---

## 4. File Structure (New & Modified Files)

```
src/
├── auth.ts                              ← NEW: Auth.js v5 config
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts             ← NEW: Auth.js API route handler
│   │   └── trail/
│   │       ├── checkin/
│   │       │   └── route.ts             ← NEW: POST — record a mural check-in
│   │       └── status/
│   │           └── route.ts             ← NEW: GET — fetch trail progress
│   └── murals/
│       └── trail/
│           └── page.tsx                 ← MODIFIED: add trail interaction UI
├── components/
│   ├── trail/
│   │   ├── TrailClient.tsx              ← NEW: main client component (state machine)
│   │   ├── EmailSignInForm.tsx          ← NEW: email input + magic link trigger
│   │   ├── TrailProgressTracker.tsx     ← NEW: shows 0/3, 1/3, 2/3, 3/3 progress
│   │   ├── MuralCheckInCard.tsx         ← NEW: per-mural card with check-in button
│   │   ├── CompletionCelebration.tsx    ← NEW: confetti/success state + code display
│   │   └── SocialSharePrompt.tsx        ← NEW: "Tag us on Instagram!" prompt
│   └── MuralMapWrapper.tsx              ← EXISTING (no changes needed)
├── lib/
│   ├── trail-service.ts                 ← NEW: business logic for trail
│   ├── trail-emails.ts                  ← NEW: email templates (redemption + notification)
│   ├── mural-data.ts                    ← EXISTING (no changes needed)
│   └── constants.ts                     ← EXISTING (may add trail constants)
├── types/
│   └── index.ts                         ← MODIFIED: add trail-related types
data/
└── trail-progress/                      ← NEW: runtime JSON storage (gitignored)
```

---

## 5. Data Models (TypeScript Types)

```typescript
// --- Add to src/types/index.ts ---

/** A single check-in event at a mural location */
export interface TrailCheckIn {
  muralId: number;          // References MuralLocation.id (1-14)
  timestamp: string;        // ISO 8601 datetime
}

/** Full trail progress for one user, persisted as JSON */
export interface TrailProgress {
  email: string;
  checkIns: TrailCheckIn[];
  questComplete: boolean;
  redemptionCode: string | null;    // null until quest is complete
  completedAt: string | null;       // ISO 8601 datetime, null until complete
}

/** Shape returned by GET /api/trail/status */
export interface TrailStatusResponse {
  authenticated: boolean;
  progress: {
    totalCheckIns: number;          // 0-14
    requiredCheckIns: number;       // 3 (configurable)
    checkedInMuralIds: number[];    // e.g., [3, 7, 11]
    questComplete: boolean;
    redemptionCode: string | null;
  } | null;                         // null if not authenticated
}

/** Shape sent via POST /api/trail/checkin */
export interface TrailCheckInRequest {
  muralId: number;
}

/** Shape returned by POST /api/trail/checkin */
export interface TrailCheckInResponse {
  success: boolean;
  message: string;
  newTotal: number;
  questComplete: boolean;
  redemptionCode: string | null;    // Populated if this check-in completed the quest
}
```

---

## 6. API Routes

### 6.1 `POST /api/trail/checkin`

**Auth:** Requires active Auth.js session (magic link signed in)  
**Body:** `{ "muralId": 7 }`  
**Logic:**
1. Verify the user is authenticated via `auth()`
2. Validate `muralId` is 1-14
3. Check if this mural is already checked in (idempotent — return success without duplicating)
4. Append check-in to user's progress file
5. If `checkIns.length >= 3` and `questComplete` is false:
   - Generate redemption code
   - Mark quest complete
   - Send redemption email to user
   - Send notification email to gallery
6. Return `TrailCheckInResponse`

### 6.2 `GET /api/trail/status`

**Auth:** Requires active Auth.js session  
**Logic:**
1. Read user's progress file (or return empty progress if none exists)
2. Return `TrailStatusResponse`

### 6.3 `GET/POST /api/auth/[...nextauth]`

**Auth:** Auth.js built-in handler — magic link sign-in, session management, token verification  
**No custom logic needed** — Auth.js handles this entirely.

---

## 7. Email Templates

### 7.1 Magic Link Email (Auth.js default, customized)

Sent automatically by Auth.js when a user enters their email.

**Subject:** `Your Mural Trail magic link`  
**Body:** Branded email with Rachel Pierce Art Gallery header, a "Continue Your Trail" button linking to the magic link URL, and a note that the link expires in 24 hours.

### 7.2 Redemption Code Email (Custom via Resend API)

Sent when user completes 3 check-ins.

**To:** User's email  
**Subject:** `🎉 You completed the Sanibel Mural Trail!`  
**Body:**
- Congratulations message
- The unique redemption code (large, prominent)
- Instructions: "Show this email to the cashier at Rachel Pierce Art Gallery, 1571 Periwinkle Way, Sanibel"
- Gallery hours / contact info
- Social sharing encouragement

### 7.3 Gallery Notification Email (Custom via Resend API)

Sent simultaneously with 7.2.

**To:** Gallery email (env var `GALLERY_EMAIL`, e.g., info@byrachelpierce.com)  
**Subject:** `Mural Trail completed — {code}`  
**Body:**
- User's email address
- Redemption code
- Completion timestamp
- Which 3 murals they checked into (names + addresses)

---

## 8. User Flow (State Machine)

The `TrailClient` component manages these states:

```
┌──────────────┐     Enter email     ┌──────────────────┐
│              │ ──────────────────→  │                  │
│  SIGNED_OUT  │                     │  AWAITING_MAGIC  │
│              │ ←──────────────────  │     _LINK        │
└──────────────┘     Back / Cancel   └────────┬─────────┘
                                              │
                                    Click magic link
                                    (in email)
                                              │
                                              ▼
                                     ┌────────────────┐
                                     │                │
                                     │   IN_PROGRESS  │ ◄── Check-ins: 0/3, 1/3, 2/3
                                     │                │
                                     └───────┬────────┘
                                             │
                                   3rd check-in recorded
                                             │
                                             ▼
                                     ┌────────────────┐
                                     │                │
                                     │   COMPLETED    │ ── Shows code + celebration
                                     │                │
                                     └────────────────┘
```

**Returning users:** If a user has already signed in and returns later, they click the magic link again from their email. Their progress is stored server-side, so they pick up where they left off.

---

## 9. Environment Variables (Updated .env.local)

```bash
# Auth.js — picks up AUTH_RESEND_KEY automatically for the Resend provider
AUTH_RESEND_KEY=re_cQuXwBZ1_HA12iLRs38gPKLyfZKPNY8Ym
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Email — "from" address for magic links and trail emails
EMAIL_FROM=onboarding@resend.dev

# Trail config
TRAIL_REQUIRED_CHECKINS=3
GALLERY_EMAIL=info@byrachelpierce.com

# Resend API key (used directly by trail-service for custom emails)
RESEND_API_KEY=re_cQuXwBZ1_HA12iLRs38gPKLyfZKPNY8Ym
```

**Note:** `AUTH_RESEND_KEY` and `RESEND_API_KEY` are the same key. Auth.js reads from `AUTH_RESEND_KEY` by convention; our custom trail emails use `RESEND_API_KEY` directly.

---

## 10. NPM Packages to Install

| Package | Purpose |
|---|---|
| `next-auth@beta` | Auth.js v5 — authentication framework |
| `unstorage` | Key-value storage abstraction (filesystem driver for dev) |
| `@auth/unstorage-adapter` | Connects Auth.js to Unstorage |
| `resend` | Resend SDK for sending custom trail emails (redemption + notification) |

**No other packages needed.** We deliberately avoid adding unnecessary dependencies.

---

## 11. Deployment Considerations

### Local Development
- Unstorage filesystem driver writes to `data/` directory
- Magic links sent via Resend test domain (only delivers to your Resend signup email)
- Run `npm run dev` as usual

### Vercel Production (Future)
- Unstorage switches to `vercelKV` driver (Vercel KV free tier: 30,000 requests/month)
- Or: switch to a lightweight hosted DB (Turso free tier SQLite, Supabase free tier Postgres)
- `EMAIL_FROM` switches to a verified custom domain address
- `AUTH_SECRET` must be a strong random value
- `GALLERY_EMAIL` set to the real gallery email

### DNS Migration (When Wix is replaced)
- Add Resend DNS records (SPF, DKIM) to the new domain registrar
- Verify domain in Resend dashboard
- Update `EMAIL_FROM` to `trail@byrachelpierce.com` or similar

---

## 12. Resolved Questions (March 1, 2026)

1. **Gallery notification email:** `matthew@pierceincode.com` during development. Will change to gallery email when site goes live.

2. **Magic link expiry:** 24 hours (Auth.js default). Confirmed acceptable.

3. **Repeat completions:** Show existing code. Do not issue a new one.

4. **Trail page structure:** Gamification UI appears above the existing mural list on `/murals/trail`. Current page structure is fine.

---

*Spec approved. Implementation in progress.*

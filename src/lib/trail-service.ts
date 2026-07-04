/**
 * Trail Service — business logic for the mural selfie trail
 *
 * This module handles all trail-related database operations:
 *   - Recording check-ins (user visited a mural)
 *   - Reading a user's progress (which murals, how many)
 *   - Generating and retrieving redemption codes on completion
 *
 * All functions talk to the Turso database through Drizzle ORM.
 * They are called by the API routes in /api/trail/*.
 *
 * For C# developers: think of this as a "service" or "repository"
 * layer — it sits between the API controllers and the database,
 * encapsulating all the SQL logic.
 *
 * R1 rewrite (Architecture §4.2): the old design stored the redemption
 * code on a "sentinel" trail_progress row with mural_id = 0, which
 * corrupted every status read and allowed a completion race to issue
 * two codes. Completion now lives in its own `trail_completions` table
 * with userId as the primary key, so "one completion per user" is a
 * database guarantee.
 */

import { db } from '@/db';
import { trailProgress, trailCompletions, users } from '@/db/schema';
import { eq, and, between } from 'drizzle-orm';
import { MURAL_LOCATIONS } from '@/lib/mural-data';

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

/** Number of unique murals a user must visit to complete the quest */
const REQUIRED_CHECKINS = parseInt(process.env.TRAIL_REQUIRED_CHECKINS ?? '3', 10);

/**
 * Highest valid mural id. Sourced from the mural data itself (not a
 * hardcoded 14) so that adding murals later "just works" — status only
 * ever counts real murals, never the old mural_id = 0 sentinel.
 */
const MURAL_COUNT = MURAL_LOCATIONS.length;

/**
 * Redemption-code alphabet: 31 unambiguous characters — no I, L, O, 0,
 * or 1, which are easily misread on a phone at the register
 * (Architecture §4.2). 31^6 ≈ 887M codes.
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** Max attempts to find a code that doesn't collide with an existing one */
const MAX_CODE_ATTEMPTS = 3;

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

/** Shape of data returned to the client about a user's trail status */
export interface TrailStatus {
  /** Array of mural IDs (1–MURAL_COUNT) the user has checked into */
  checkedInMurals: number[];
  /** Total unique murals visited */
  totalCheckIns: number;
  /** How many murals are needed to complete the quest */
  requiredCheckIns: number;
  /** Whether the user has completed the quest */
  isComplete: boolean;
  /** The redemption code, only present if quest is complete */
  redemptionCode: string | null;
}

/**
 * Result of a recordCheckIn call.
 *
 * `completionInserted` is true for exactly ONE request — the one whose
 * INSERT actually created the completion row. The check-in route uses
 * it to decide whether to send the redemption + gallery emails, so a
 * completion race never sends two email pairs (Architecture §4.2 hole 3).
 */
export interface RecordCheckInResult {
  status: TrailStatus;
  completionInserted: boolean;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Get the current trail status for a user.
 *
 * Counts distinct mural IDs in range 1..MURAL_COUNT from trail_progress
 * (so no sentinel/out-of-range row can inflate the count), and reads the
 * redemption code — if any — from trail_completions.
 *
 * @param userId - The Auth.js user ID (from the session)
 * @returns TrailStatus object with progress details
 */
export async function getTrailStatus(userId: string): Promise<TrailStatus> {
  // Only count real murals (1..MURAL_COUNT). The BETWEEN guard is what
  // makes the retired mural_id = 0 sentinel harmless even if any row
  // still existed.
  const rows = await db
    .select({ muralId: trailProgress.muralId })
    .from(trailProgress)
    .where(and(eq(trailProgress.userId, userId), between(trailProgress.muralId, 1, MURAL_COUNT)));

  // Extract unique mural IDs (a user could check in at the same mural
  // twice — we only count unique ones).
  const uniqueMuralIds = [...new Set(rows.map((r) => r.muralId))];

  // The code lives in its own table now, one row per completed user.
  const completion = await db
    .select({ code: trailCompletions.redemptionCode })
    .from(trailCompletions)
    .where(eq(trailCompletions.userId, userId));

  const isComplete = uniqueMuralIds.length >= REQUIRED_CHECKINS;

  return {
    checkedInMurals: uniqueMuralIds,
    totalCheckIns: uniqueMuralIds.length,
    requiredCheckIns: REQUIRED_CHECKINS,
    isComplete,
    redemptionCode: completion[0]?.code ?? null,
  };
}

/**
 * Record a check-in at a specific mural.
 *
 * Business rules:
 *   1. If the user already checked in at this mural, return their
 *      current status without inserting a duplicate.
 *   2. Insert the check-in row.
 *   3. If this check-in completes the quest (reaches REQUIRED_CHECKINS
 *      unique murals) and no completion exists yet, create one
 *      atomically (race-safe — see ensureCompletion).
 *   4. Return updated status plus whether THIS call inserted the
 *      completion row.
 *
 * @param userId - Auth.js user ID
 * @param muralId - Which mural (1–MURAL_COUNT) the user is checking into
 * @returns RecordCheckInResult — updated status + completionInserted flag
 */
export async function recordCheckIn(userId: string, muralId: number): Promise<RecordCheckInResult> {
  // --- Guard: already checked in at this mural? ---
  const existing = await db
    .select({ id: trailProgress.id })
    .from(trailProgress)
    .where(and(eq(trailProgress.userId, userId), eq(trailProgress.muralId, muralId)));

  if (existing.length > 0) {
    // Already visited this mural — just return current status.
    return { status: await getTrailStatus(userId), completionInserted: false };
  }

  // --- Insert the new check-in ---
  await db.insert(trailProgress).values({
    userId,
    muralId,
    checkedInAt: new Date().toISOString(),
  });
  logEvent('trail_checkin', { userId, muralId });

  // --- Did this check-in complete the quest? ---
  const status = await getTrailStatus(userId);

  if (!status.isComplete) {
    return { status, completionInserted: false };
  }

  if (status.redemptionCode) {
    // Already completed earlier (they're just visiting more murals) —
    // return the existing code, no new completion, no emails.
    return { status, completionInserted: false };
  }

  // Quest just reached completion — ensure a single completion row exists.
  const { inserted, code } = await ensureCompletion(userId);
  logEvent(inserted ? 'trail_completion' : 'trail_completion_race_lost', { userId });

  return {
    status: { ...status, redemptionCode: code },
    completionInserted: inserted,
  };
}

/**
 * Look up the timestamped check-ins (mural 1..MURAL_COUNT) for a user,
 * oldest first. Used to build the gallery email, which lists each mural
 * with its REAL stored check-in time (Architecture §4.2 hole 4).
 */
export async function getCheckIns(
  userId: string,
): Promise<{ muralId: number; checkedInAt: string }[]> {
  const rows = await db
    .select({ muralId: trailProgress.muralId, checkedInAt: trailProgress.checkedInAt })
    .from(trailProgress)
    .where(and(eq(trailProgress.userId, userId), between(trailProgress.muralId, 1, MURAL_COUNT)))
    .orderBy(trailProgress.checkedInAt);

  // Keep the first check-in per mural (a user could tap twice); dedupe
  // while preserving chronological order.
  const seen = new Set<number>();
  const result: { muralId: number; checkedInAt: string }[] = [];
  for (const row of rows) {
    if (seen.has(row.muralId)) continue;
    seen.add(row.muralId);
    result.push(row);
  }
  return result;
}

/**
 * Read the user's completion row (code + completion time), or null if
 * they haven't completed. Used by the check-in route to build the
 * gallery email with the real stored completion timestamp.
 */
export async function getCompletion(
  userId: string,
): Promise<{ code: string; completedAt: string } | null> {
  const rows = await db
    .select({ code: trailCompletions.redemptionCode, completedAt: trailCompletions.completedAt })
    .from(trailCompletions)
    .where(eq(trailCompletions.userId, userId));

  return rows[0] ?? null;
}

/**
 * Get the user's email address from the users table.
 *
 * Used when sending the redemption code email and gallery
 * notification — we need the actual email, not just the user ID.
 *
 * @param userId - Auth.js user ID
 * @returns The user's email, or null if not found
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const rows = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));

  return rows[0]?.email ?? null;
}

// ----------------------------------------------------------------
// Private helpers
// ----------------------------------------------------------------

/**
 * Create the user's completion row exactly once, race-safely.
 *
 * `INSERT … ON CONFLICT(user_id) DO NOTHING RETURNING` collapses a
 * concurrent double-completion to a single winning insert: the winner
 * gets its row back (returning.length === 1); a loser gets an empty
 * result and reads back the canonical code. Separately, the UNIQUE
 * constraint on redemption_code turns the (astronomically rare) code
 * collision into a retry with a fresh code (max MAX_CODE_ATTEMPTS).
 *
 * @returns inserted=true only for the request that created the row
 */
async function ensureCompletion(userId: string): Promise<{ inserted: boolean; code: string }> {
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateRedemptionCode();
    try {
      const inserted = await db
        .insert(trailCompletions)
        .values({
          userId,
          redemptionCode: code,
          completedAt: new Date().toISOString(),
        })
        .onConflictDoNothing({ target: trailCompletions.userId })
        .returning({ code: trailCompletions.redemptionCode });

      if (inserted.length === 1) {
        return { inserted: true, code: inserted[0].code };
      }

      // Lost the completion race — another request already inserted the
      // canonical row. Return its code so the caller can still show it.
      const canonical = await db
        .select({ code: trailCompletions.redemptionCode })
        .from(trailCompletions)
        .where(eq(trailCompletions.userId, userId));
      return { inserted: false, code: canonical[0].code };
    } catch (err) {
      // A UNIQUE violation on redemption_code (a different user already
      // holds this code) — retry with a new one. Anything else rethrows.
      if (isRedemptionCodeCollision(err) && attempt < MAX_CODE_ATTEMPTS) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Could not generate a unique redemption code after retries');
}

/**
 * Generate a redemption code like "BRP-A2C4KM".
 *
 * The prefix "BRP" stands for "By Rachel Pierce" and stays fixed —
 * codes already issued use it (DECISIONS 006). The 6-character suffix
 * is drawn from CODE_ALPHABET using the crypto CSPRNG with rejection
 * sampling, so the distribution is uniform (no modulo bias) and the
 * codes are not predictable the way Math.random() ones were.
 */
function generateRedemptionCode(): string {
  const suffix: string[] = [];
  // Reject byte values in the "ragged tail" so that byte % alphabetLength
  // is uniform. 256 % 31 = 8, so values 248..255 are rejected.
  const rejectAtOrAbove = 256 - (256 % CODE_ALPHABET.length);
  const buf = new Uint8Array(1);

  while (suffix.length < CODE_LENGTH) {
    crypto.getRandomValues(buf);
    const byte = buf[0];
    if (byte >= rejectAtOrAbove) continue; // rejection sampling
    suffix.push(CODE_ALPHABET[byte % CODE_ALPHABET.length]);
  }

  return `BRP-${suffix.join('')}`;
}

/** True if the error is a UNIQUE violation on trail_completions.redemption_code. */
function isRedemptionCodeCollision(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed:\s*trail_completions\.redemption_code/i.test(message);
}

/**
 * One structured JSON log line per trail mutation (Spec §3 rule 11).
 * Vercel captures stdout; ids only, never the code or the email address.
 */
function logEvent(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...fields }));
}

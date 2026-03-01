/**
 * Trail Service — business logic for the mural selfie trail
 *
 * This module handles all trail-related database operations:
 *   - Recording check-ins (user visited a mural)
 *   - Reading a user's progress (which murals, how many)
 *   - Generating and retrieving redemption codes
 *
 * All functions talk to the Turso database through Drizzle ORM.
 * They are called by the API routes in /api/trail/*.
 *
 * For C# developers: think of this as a "service" or "repository"
 * layer — it sits between the API controllers and the database,
 * encapsulating all the SQL logic.
 */

import { db } from "@/db";
import { trailProgress, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

/** Number of unique murals a user must visit to complete the quest */
const REQUIRED_CHECKINS = parseInt(
  process.env.TRAIL_REQUIRED_CHECKINS ?? "3",
  10
);

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

/** Shape of data returned to the client about a user's trail status */
export interface TrailStatus {
  /** Array of mural IDs (1–14) the user has checked into */
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

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Get the current trail status for a user.
 *
 * Queries the trail_progress table for all rows belonging to this
 * user, extracts the unique mural IDs, checks for an existing
 * redemption code, and returns a summary object.
 *
 * @param userId - The Auth.js user ID (from the session)
 * @returns TrailStatus object with progress details
 */
export async function getTrailStatus(userId: string): Promise<TrailStatus> {
  // Fetch all check-in rows for this user
  // For C# devs: similar to  dbContext.TrailProgress.Where(tp => tp.UserId == userId).ToList()
  const rows = await db
    .select()
    .from(trailProgress)
    .where(eq(trailProgress.userId, userId));

  // Extract unique mural IDs (a user could theoretically check in
  // at the same mural twice — we only count unique ones)
  const uniqueMuralIds = [...new Set(rows.map((r) => r.muralId))];

  // Look for an existing redemption code (only one row will have it)
  const redemptionRow = rows.find((r) => r.redemptionCode !== null);

  const isComplete = uniqueMuralIds.length >= REQUIRED_CHECKINS;

  return {
    checkedInMurals: uniqueMuralIds,
    totalCheckIns: uniqueMuralIds.length,
    requiredCheckIns: REQUIRED_CHECKINS,
    isComplete,
    redemptionCode: redemptionRow?.redemptionCode ?? null,
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
 *      unique murals), generate a redemption code and store it.
 *   4. Return updated status.
 *
 * @param userId - Auth.js user ID
 * @param muralId - Which mural (1–14) the user is checking into
 * @returns Updated TrailStatus after the check-in
 */
export async function recordCheckIn(
  userId: string,
  muralId: number
): Promise<TrailStatus> {
  // --- Guard: already checked in at this mural? ---
  const existing = await db
    .select()
    .from(trailProgress)
    .where(
      and(
        eq(trailProgress.userId, userId),
        eq(trailProgress.muralId, muralId)
      )
    );

  if (existing.length > 0) {
    // Already visited this mural — just return current status
    return getTrailStatus(userId);
  }

  // --- Insert the new check-in ---
  // For C# devs: similar to  dbContext.TrailProgress.Add(new TrailProgress { ... })
  await db.insert(trailProgress).values({
    userId,
    muralId,
    checkedInAt: new Date().toISOString(),
  });

  // --- Check if this check-in completes the quest ---
  const status = await getTrailStatus(userId);

  if (status.isComplete && !status.redemptionCode) {
    // Quest just completed — generate a unique redemption code
    const code = generateRedemptionCode();

    // Store the code on the row we just inserted
    // (We find the latest row for this user+mural and update it)
    await db
      .insert(trailProgress)
      .values({
        userId,
        muralId: 0, // Sentinel: this row is just for the code
        checkedInAt: new Date().toISOString(),
        redemptionCode: code,
      });

    // Return updated status with the new code
    return {
      ...status,
      redemptionCode: code,
    };
  }

  return status;
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
export async function getUserEmail(
  userId: string
): Promise<string | null> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  return rows[0]?.email ?? null;
}

// ----------------------------------------------------------------
// Private helpers
// ----------------------------------------------------------------

/**
 * Generate a unique redemption code like "BRP-A1B2C3".
 *
 * The prefix "BRP" stands for "By Rachel Pierce".
 * The suffix is 6 random alphanumeric characters, giving us
 * 36^6 ≈ 2.2 billion possible codes — more than enough.
 *
 * The cashier just needs to see this code on the customer's phone
 * to verify they completed the trail.
 */
function generateRedemptionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BRP-${suffix}`;
}

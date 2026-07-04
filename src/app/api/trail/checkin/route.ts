/**
 * POST /api/trail/checkin — Record a mural check-in
 *
 * This endpoint is called when a signed-in user taps "I visited this mural."
 * It validates the request, records the check-in, and if the quest is now
 * complete, triggers redemption + notification emails.
 *
 * AUTHENTICATION: Requires an active Auth.js session (magic link sign-in).
 * Unauthenticated requests get a 401.
 *
 * REQUEST BODY: { "muralId": 7 }  (integer 1..MURAL_LOCATIONS.length)
 * RESPONSE: TrailCheckInResponse (see types/index.ts)
 *
 * IDEMPOTENT: Checking in at the same mural twice returns success without
 * duplicating the entry. This is by design — the user might tap the button
 * twice or refresh the page.
 *
 * C# ANALOGY:
 *   This is like a minimal API endpoint:
 *     app.MapPost("/api/trail/checkin", [Authorize] async (CheckInRequest req, TrailService svc) => { ... })
 *   The auth() call is like [Authorize] — it checks the JWT session.
 *   The NextResponse.json() calls are like Results.Ok() / Results.Json().
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { recordCheckIn, getUserEmail, getCheckIns, getCompletion } from '@/lib/trail-service';
import { sendRedemptionEmail, sendGalleryNotification } from '@/lib/trail-emails';
import { MURAL_LOCATIONS } from '@/lib/mural-data';
import type { TrailCheckInResponse } from '@/types';

/** Highest valid mural id — sourced from the data so adding murals "just works". */
const MURAL_COUNT = MURAL_LOCATIONS.length;

export async function POST(request: Request) {
  // ── 1. Check authentication ──────────────────────────────────────
  // auth() reads the session cookie. Returns null if not signed in.
  // With our session callback in auth.ts, userId is available.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Please sign in to check in at murals.' },
      { status: 401 },
    );
  }
  const userId = session.user.id;

  // ── 2. Parse and validate the request body ───────────────────────
  let body: { muralId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const muralId = body.muralId;

  // Validate muralId is a number in the valid range (1..MURAL_COUNT)
  if (
    typeof muralId !== 'number' ||
    !Number.isInteger(muralId) ||
    muralId < 1 ||
    muralId > MURAL_COUNT
  ) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid mural ID. Must be an integer between 1 and ${MURAL_COUNT}.`,
      },
      { status: 400 },
    );
  }

  // ── 3. Record the check-in ───────────────────────────────────────
  try {
    // recordCheckIn is race-safe: `completionInserted` is true for
    // exactly the ONE request whose insert created the completion row,
    // so a completion race never sends two email pairs.
    const { status, completionInserted } = await recordCheckIn(userId, muralId);

    // ── 4. If THIS request completed the quest, send emails ──────
    // Fire-and-forget: the user shouldn't wait on email, and a check-in
    // that was recorded stays successful even if email later fails.
    if (completionInserted && status.redemptionCode) {
      const userEmail = await getUserEmail(userId);

      if (userEmail) {
        // Build the payload from the user's REAL stored data: each
        // mural's own check-in time and the actual completion time
        // (Architecture §4.2 hole 4 — no more "now" on every row).
        const [checkIns, completion] = await Promise.all([
          getCheckIns(userId),
          getCompletion(userId),
        ]);

        const payload = {
          email: userEmail,
          code: status.redemptionCode,
          completedAt: completion?.completedAt ?? new Date().toISOString(),
          checkIns,
        };

        // Promise.allSettled won't throw even if one email fails.
        Promise.allSettled([
          sendRedemptionEmail(userEmail, status.redemptionCode),
          sendGalleryNotification(payload),
        ]).then((results) => {
          // One log line per email failure, with the ids involved (Rule 11).
          const kinds = ['redemption', 'gallery'] as const;
          results.forEach((result, i) => {
            if (result.status === 'rejected') {
              console.error(
                JSON.stringify({
                  event: 'trail_email_failed',
                  kind: kinds[i],
                  userId: userId,
                  reason: String(result.reason),
                }),
              );
            }
          });
        });
      } else {
        console.error(
          JSON.stringify({
            event: 'trail_email_skipped_no_address',
            userId: userId,
          }),
        );
      }
    }

    // ── 5. Build and return the response ─────────────────────────
    // Map TrailStatus fields to the TrailCheckInResponse shape
    // that the frontend expects.
    const response: TrailCheckInResponse = {
      success: true,
      message: completionInserted
        ? 'Quest complete! Check your email for your redemption code.'
        : `Checked in! ${status.totalCheckIns}/${status.requiredCheckIns} murals visited.`,
      newTotal: status.totalCheckIns,
      questComplete: status.isComplete,
      redemptionCode: status.isComplete ? status.redemptionCode : null,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[trail/checkin] Error recording check-in:', err);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}

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
 * REQUEST BODY: { "muralId": 7 }  (integer 1-14)
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
import { getTrailStatus, recordCheckIn, getUserEmail } from '@/lib/trail-service';
import { sendRedemptionEmail, sendGalleryNotification } from '@/lib/trail-emails';
import type { TrailCheckInResponse } from '@/types';

export async function POST(request: Request) {
  // ── 1. Check authentication ──────────────────────────────────────
  // auth() reads the session cookie. Returns null if not signed in.
  // With our session callback in auth.ts, session.user.id is available.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Please sign in to check in at murals.' },
      { status: 401 }
    );
  }

  // ── 2. Parse and validate the request body ───────────────────────
  let body: { muralId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const muralId = body.muralId;

  // Validate muralId is a number in the valid range (1-14)
  if (typeof muralId !== 'number' || !Number.isInteger(muralId) || muralId < 1 || muralId > 14) {
    return NextResponse.json(
      { success: false, message: `Invalid mural ID. Must be an integer between 1 and 14.` },
      { status: 400 }
    );
  }

  // ── 3. Record the check-in ───────────────────────────────────────
  try {
    // Snapshot the status BEFORE recording so we can detect if THIS
    // specific check-in is what completed the quest.
    const previousStatus = await getTrailStatus(session.user.id);
    const wasAlreadyComplete = previousStatus.isComplete;

    // recordCheckIn takes the user's database ID (not email) and the mural ID.
    // It returns the updated TrailStatus after recording the check-in.
    const status = await recordCheckIn(session.user.id, muralId);

    // Did THIS check-in complete the quest?
    const justCompleted = status.isComplete && !wasAlreadyComplete;

    // ── 4. If quest just completed, send emails ──────────────────
    // We send both emails in parallel — fire-and-forget style.
    // If an email fails, we still return success to the user because
    // the check-in WAS recorded. Email failures are logged server-side.
    if (justCompleted && status.redemptionCode) {
      // Look up the user's email for the notification emails.
      // (We store userId in trail_progress, but emails need the address.)
      const userEmail = await getUserEmail(session.user.id);

      if (userEmail) {
        // Don't await these — the user shouldn't wait for emails to send.
        // Promise.allSettled won't throw even if one email fails.
        Promise.allSettled([
          sendRedemptionEmail(userEmail, status.redemptionCode),
          sendGalleryNotification({
            // Build a TrailProgress-compatible object for the email helper.
            // The email function expects the old TrailProgress shape.
            email: userEmail,
            checkIns: status.checkedInMurals.map((id) => ({
              muralId: id,
              timestamp: new Date().toISOString(),
            })),
            questComplete: true,
            redemptionCode: status.redemptionCode,
            completedAt: new Date().toISOString(),
          }),
        ]).then((results) => {
          // Log any email failures for debugging (these show in server console)
          results.forEach((result, i) => {
            if (result.status === 'rejected') {
              console.error(`[trail/checkin] Email ${i} failed:`, result.reason);
            }
          });
        });
      }
    }

    // ── 5. Build and return the response ─────────────────────────
    // Map TrailStatus fields to the TrailCheckInResponse shape
    // that the frontend expects.
    const response: TrailCheckInResponse = {
      success: true,
      message: justCompleted
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
      { status: 500 }
    );
  }
}

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
import { recordCheckIn, getRequiredCheckIns } from '@/lib/trail-service';
import { sendRedemptionEmail, sendGalleryNotification } from '@/lib/trail-emails';
import type { TrailCheckInResponse } from '@/types';

export async function POST(request: Request) {
  // ── 1. Check authentication ──────────────────────────────────────
  // auth() reads the JWT session cookie. Returns null if not signed in.
  const session = await auth();
  if (!session?.user?.email) {
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
    const { progress, justCompleted } = await recordCheckIn(session.user.email, muralId);

    // ── 4. If quest just completed, send emails ──────────────────
    // We send both emails in parallel — fire-and-forget style.
    // If an email fails, we still return success to the user because
    // the check-in WAS recorded. Email failures are logged server-side.
    if (justCompleted && progress.redemptionCode) {
      // Don't await these — the user shouldn't wait for emails to send.
      // Promise.allSettled won't throw even if one email fails.
      Promise.allSettled([
        sendRedemptionEmail(session.user.email, progress.redemptionCode),
        sendGalleryNotification(progress),
      ]).then((results) => {
        // Log any email failures for debugging (these show in server console)
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error(`[trail/checkin] Email ${i} failed:`, result.reason);
          }
        });
      });
    }

    // ── 5. Build and return the response ─────────────────────────
    const response: TrailCheckInResponse = {
      success: true,
      message: justCompleted
        ? 'Quest complete! Check your email for your redemption code.'
        : `Checked in! ${progress.checkIns.length}/${getRequiredCheckIns()} murals visited.`,
      newTotal: progress.checkIns.length,
      questComplete: progress.questComplete,
      redemptionCode: progress.questComplete ? progress.redemptionCode : null,
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

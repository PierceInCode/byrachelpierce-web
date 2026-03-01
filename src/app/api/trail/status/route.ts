/**
 * GET /api/trail/status — Fetch the current user's trail progress
 *
 * Returns the user's check-in count, which murals they've visited,
 * whether the quest is complete, and the redemption code (if earned).
 *
 * AUTHENTICATION: Requires an active Auth.js session.
 * If not signed in, returns { authenticated: false, progress: null }.
 * This is NOT a 401 — the frontend needs to distinguish "not signed in"
 * from "signed in but no progress" to show the right UI state.
 *
 * RESPONSE: TrailStatusResponse (see types/index.ts)
 *
 * C# ANALOGY:
 *   app.MapGet("/api/trail/status", async (HttpContext ctx, TrailService svc) => {
 *     var user = ctx.User;
 *     if (!user.Identity.IsAuthenticated) return Results.Ok(new { authenticated = false });
 *     var progress = await svc.GetProgress(user.Id);
 *     return Results.Ok(new TrailStatusResponse { ... });
 *   });
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getTrailStatus } from '@/lib/trail-service';
import type { TrailStatusResponse } from '@/types';

export async function GET() {
  // ── 1. Check authentication ──────────────────────────────────────
  // auth() reads the session cookie and returns the session object.
  // With our session callback in auth.ts, session.user.id is available.
  const session = await auth();

  // Not signed in — return a known shape so the frontend can handle it
  if (!session?.user?.id) {
    const response: TrailStatusResponse = {
      authenticated: false,
      progress: null,
    };
    return NextResponse.json(response);
  }

  // ── 2. Look up the user's trail progress ─────────────────────────
  try {
    // getTrailStatus takes the user's database ID (not email).
    // It returns a TrailStatus object with checkedInMurals[], isComplete, etc.
    const status = await getTrailStatus(session.user.id);

    // Map the TrailStatus shape from trail-service to the
    // TrailStatusResponse shape that the frontend expects.
    // These shapes are slightly different because trail-service uses
    // internal naming (isComplete, checkedInMurals) while the API
    // response uses frontend-friendly naming (questComplete, checkedInMuralIds).
    const response: TrailStatusResponse = {
      authenticated: true,
      progress: {
        totalCheckIns: status.totalCheckIns,
        requiredCheckIns: status.requiredCheckIns,
        checkedInMuralIds: status.checkedInMurals,
        questComplete: status.isComplete,
        redemptionCode: status.redemptionCode,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[trail/status] Error fetching progress:', err);
    return NextResponse.json(
      { authenticated: true, progress: null },
      { status: 500 }
    );
  }
}

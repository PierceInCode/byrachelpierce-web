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
 *     var progress = await svc.GetProgress(user.Email);
 *     return Results.Ok(new TrailStatusResponse { ... });
 *   });
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getTrailProgress, getRequiredCheckIns } from '@/lib/trail-service';
import type { TrailStatusResponse } from '@/types';

export async function GET() {
  // ── 1. Check authentication ──────────────────────────────────────
  const session = await auth();

  // Not signed in — return a known shape so the frontend can handle it
  if (!session?.user?.email) {
    const response: TrailStatusResponse = {
      authenticated: false,
      progress: null,
    };
    return NextResponse.json(response);
  }

  // ── 2. Look up the user's trail progress ─────────────────────────
  try {
    const progress = await getTrailProgress(session.user.email);

    const response: TrailStatusResponse = {
      authenticated: true,
      progress: progress
        ? {
            totalCheckIns: progress.checkIns.length,
            requiredCheckIns: getRequiredCheckIns(),
            checkedInMuralIds: progress.checkIns.map((c) => c.muralId),
            questComplete: progress.questComplete,
            redemptionCode: progress.redemptionCode,
          }
        : {
            // User is authenticated but hasn't started the trail yet
            totalCheckIns: 0,
            requiredCheckIns: getRequiredCheckIns(),
            checkedInMuralIds: [],
            questComplete: false,
            redemptionCode: null,
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

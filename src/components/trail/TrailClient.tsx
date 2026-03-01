/**
 * TrailClient — Main client-side state machine for the Mural Selfie Trail.
 *
 * This is the "orchestrator" component that manages the trail experience.
 * It sits at the top of the trail page and controls which UI to show
 * based on the user's authentication and progress state.
 *
 * STATE MACHINE:
 *   LOADING         → Checking session + fetching progress from API
 *   SIGNED_OUT      → Shows EmailSignInForm
 *   AWAITING_MAGIC  → User submitted email, waiting for magic link click
 *   IN_PROGRESS     → Signed in, shows progress tracker + mural check-in list
 *   COMPLETED       → All 3 done, shows CompletionCelebration
 *
 * DATA FLOW:
 *   1. On mount, fetch GET /api/trail/status
 *   2. If not authenticated → SIGNED_OUT state
 *   3. If authenticated → IN_PROGRESS or COMPLETED (based on progress data)
 *   4. Check-ins are POST'd to /api/trail/checkin
 *   5. After each check-in, local state is updated optimistically
 *
 * C# ANALOGY:
 *   This is like a Blazor page with @code { } that manages state,
 *   calls HttpClient to fetch data, and conditionally renders
 *   different child components based on the current state.
 *   The useEffect hook is like OnInitializedAsync().
 *   The useState hooks are like private fields on the component.
 *
 * WHY 'use client'?
 *   This component uses hooks (useState, useEffect) and handles user
 *   interaction (form submission, button clicks). Server Components
 *   can't use hooks or event handlers — they only render static HTML.
 *   This is like the difference between a Razor Page (server) and
 *   a Blazor WebAssembly component (client).
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TrailStatusResponse } from '@/types';

// Child components — each handles one piece of the UI
import EmailSignInForm from './EmailSignInForm';
import TrailProgressTracker from './TrailProgressTracker';
import MuralCheckInCard from './MuralCheckInCard';
import CompletionCelebration from './CompletionCelebration';
import SocialSharePrompt from './SocialSharePrompt';

// Mural data — used to render the check-in list
import { MURAL_LOCATIONS } from '@/lib/mural-data';

// ── State Machine Types ──────────────────────────────────────────────

type TrailState = 'LOADING' | 'SIGNED_OUT' | 'AWAITING_MAGIC' | 'IN_PROGRESS' | 'COMPLETED';

// ── Component ────────────────────────────────────────────────────────

export default function TrailClient() {
  // ── State ──────────────────────────────────────────────────────────
  const [trailState, setTrailState] = useState<TrailState>('LOADING');
  const [email, setEmail] = useState<string>('');
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [requiredCheckIns, setRequiredCheckIns] = useState(3);
  const [checkedInMuralIds, setCheckedInMuralIds] = useState<number[]>([]);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // ── Fetch status on mount ──────────────────────────────────────────
  // This runs once when the component first renders in the browser.
  // It checks if the user has an active session and loads their progress.
  //
  // Also runs when the user returns after clicking a magic link —
  // the page reloads, this effect fires, and now the session exists.

  const fetchStatus = useCallback(async () => {
    try {
      // Fetch trail status AND session data in parallel.
      // We need both: trail status tells us progress, session tells us
      // the user's email (for display on the completion screen).
      //
      // Previously these were separate calls with a race condition —
      // the component could transition to COMPLETED before the email
      // was loaded, resulting in "emailed to ." with a blank address.
      const [statusRes, sessionRes] = await Promise.all([
        fetch('/api/trail/status'),
        fetch('/api/auth/session'),
      ]);

      const data: TrailStatusResponse = await statusRes.json();

      // Extract email from the Auth.js session endpoint.
      // This always returns { user: { name, email, image } } when
      // the user is signed in, or {} when signed out.
      try {
        const session = await sessionRes.json();
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      } catch {
        // Session parse failed — not critical, email is just for display
      }

      if (!data.authenticated) {
        // Check URL params — Auth.js redirects here with ?check-email=true
        // after the user submits their email for a magic link.
        const params = new URLSearchParams(window.location.search);
        if (params.get('check-email') === 'true') {
          setTrailState('AWAITING_MAGIC');
        } else {
          setTrailState('SIGNED_OUT');
        }
        return;
      }

      // User is authenticated — load their progress
      if (data.progress) {
        setTotalCheckIns(data.progress.totalCheckIns);
        setRequiredCheckIns(data.progress.requiredCheckIns);
        setCheckedInMuralIds(data.progress.checkedInMuralIds);
        setRedemptionCode(data.progress.redemptionCode);

        if (data.progress.questComplete) {
          setTrailState('COMPLETED');
        } else {
          setTrailState('IN_PROGRESS');
        }
      } else {
        setTrailState('IN_PROGRESS');
      }
    } catch {
      // If the status check fails, default to signed-out state.
      // The user can still use the rest of the trail page.
      setTrailState('SIGNED_OUT');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Handlers ───────────────────────────────────────────────────────

  /**
   * Called when the EmailSignInForm successfully sends a magic link.
   * Transitions to the AWAITING_MAGIC state.
   */
  function handleEmailSent() {
    setTrailState('AWAITING_MAGIC');
  }

  /**
   * Handle a check-in at a specific mural.
   * POSTs to the API, then updates local state optimistically.
   */
  async function handleCheckIn(muralId: number) {
    setCheckInError(null);

    try {
      const res = await fetch('/api/trail/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muralId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCheckInError(data.message || 'Check-in failed. Please try again.');
        return;
      }

      // Update local state with the server's response
      setTotalCheckIns(data.newTotal);
      // Add the mural ID to our local checked-in list (if not already there)
      setCheckedInMuralIds((prev) =>
        prev.includes(muralId) ? prev : [...prev, muralId]
      );

      if (data.questComplete) {
        setRedemptionCode(data.redemptionCode);
        setTrailState('COMPLETED');
      }
    } catch {
      setCheckInError('Network error. Please check your connection and try again.');
    }
  }

  /**
   * Sign out — redirects to the Auth.js sign-out endpoint.
   * After sign-out, the user is redirected back to the trail page.
   */
  async function handleSignOut() {
    try {
      // Fetch CSRF token first (Auth.js requires it for sign-out too)
      const csrfRes = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfRes.json();

      // POST to the sign-out endpoint
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: '/murals/trail',
        }),
      });

      // Reset all local state
      setTrailState('SIGNED_OUT');
      setEmail('');
      setTotalCheckIns(0);
      setCheckedInMuralIds([]);
      setRedemptionCode(null);
      setCheckInError(null);
    } catch {
      // Force reload as fallback — clears session on page load
      window.location.href = '/murals/trail';
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* ── State: LOADING ──────────────────────────────────────────── */}
      {trailState === 'LOADING' && (
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-slate-light)',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            Loading your trail progress…
          </p>
        </div>
      )}

      {/* ── State: SIGNED_OUT ───────────────────────────────────────── */}
      {trailState === 'SIGNED_OUT' && (
        <>
          <EmailSignInForm onEmailSent={handleEmailSent} />
          <SocialSharePrompt />
        </>
      )}

      {/* ── State: AWAITING_MAGIC ───────────────────────────────────── */}
      {trailState === 'AWAITING_MAGIC' && (
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            border: '1px solid var(--color-teal)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '2rem',
              margin: '0 0 0.5rem',
              lineHeight: 1,
            }}
          >
            ✉️
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xl)',
              fontWeight: 700,
              color: 'var(--color-slate-dark)',
              margin: '0 0 0.5rem',
            }}
          >
            Check Your Email
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-slate)',
              lineHeight: 1.6,
              margin: '0 0 1rem',
              maxWidth: '40ch',
              marginInline: 'auto',
            }}
          >
            We sent you a magic link. Click it to sign in and start tracking your
            mural visits. The link expires in 24 hours.
          </p>
          <button
            onClick={() => setTrailState('SIGNED_OUT')}
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-teal)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              padding: '0.5rem',
            }}
          >
            ← Try a different email
          </button>
        </div>
      )}

      {/* ── State: IN_PROGRESS ──────────────────────────────────────── */}
      {trailState === 'IN_PROGRESS' && (
        <>
          <TrailProgressTracker
            totalCheckIns={totalCheckIns}
            requiredCheckIns={requiredCheckIns}
            email={email}
            questComplete={false}
            onSignOut={handleSignOut}
          />

          <SocialSharePrompt />

          {/* Error message for failed check-ins */}
          {checkInError && (
            <div
              role="alert"
              style={{
                backgroundColor: '#fff3f3',
                border: '1px solid #ffcdd2',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: '#c62828',
                  margin: 0,
                }}
              >
                {checkInError}
              </p>
            </div>
          )}

          {/* Mural check-in list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--color-slate-dark)',
                margin: '0.5rem 0 0.25rem',
              }}
            >
              Check In at Any 3 Murals
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-slate)',
                margin: '0 0 0.5rem',
                lineHeight: 1.5,
              }}
            >
              Visit a mural in person, then tap &ldquo;I Visited!&rdquo; to record your stop.
            </p>
            {MURAL_LOCATIONS.map((mural) => (
              <MuralCheckInCard
                key={mural.id}
                muralId={mural.id}
                name={mural.name}
                address={mural.address}
                isCheckedIn={checkedInMuralIds.includes(mural.id)}
                isAuthenticated={true}
                onCheckIn={handleCheckIn}
              />
            ))}
          </div>
        </>
      )}

      {/* ── State: COMPLETED ────────────────────────────────────────── */}
      {trailState === 'COMPLETED' && (
        <>
          <CompletionCelebration
            redemptionCode={redemptionCode || ''}
            email={email}
            onSignOut={handleSignOut}
          />
          <SocialSharePrompt />
        </>
      )}
    </div>
  );
}

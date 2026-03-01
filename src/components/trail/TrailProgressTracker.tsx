/**
 * TrailProgressTracker — Displays check-in progress (e.g., 2/3 murals visited)
 *
 * Shows:
 *   - A visual progress bar / step indicator
 *   - Text showing "X of 3 murals visited"
 *   - The user's email (so they know which account they're using)
 *   - A sign-out option
 *
 * C# ANALOGY:
 *   A Blazor component that receives a ViewModel with progress data
 *   and renders a progress bar + stats.
 */
'use client';

interface TrailProgressTrackerProps {
  totalCheckIns: number;
  requiredCheckIns: number;
  email: string;
  questComplete: boolean;
  onSignOut: () => void;
}

export default function TrailProgressTracker({
  totalCheckIns,
  requiredCheckIns,
  email,
  questComplete,
  onSignOut,
}: TrailProgressTrackerProps) {
  // Calculate percentage for the progress bar (cap at 100%)
  const progressPercent = Math.min((totalCheckIns / requiredCheckIns) * 100, 100);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(1.25rem, 3vw, 1.75rem)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header row: user info + sign out */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-slate)',
            margin: 0,
          }}
        >
          Signed in as <strong style={{ color: 'var(--color-slate-dark)' }}>{email}</strong>
        </p>
        <button
          onClick={onSignOut}
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-slate-light)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            padding: '0.25rem 0.5rem',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Progress text */}
      <div style={{ marginBottom: '0.75rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 700,
            color: questComplete ? 'var(--color-teal)' : 'var(--color-slate-dark)',
            margin: '0 0 0.25rem',
          }}
        >
          {questComplete
            ? '🎉 Trail Complete!'
            : `${totalCheckIns} of ${requiredCheckIns} Murals Visited`}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-slate)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {questComplete
            ? 'Check your email for your redemption code.'
            : totalCheckIns === 0
              ? 'Tap "I visited this mural" at each stop to track your progress.'
              : `Just ${requiredCheckIns - totalCheckIns} more to go!`}
        </p>
      </div>

      {/* Visual progress bar */}
      <div
        style={{
          width: '100%',
          height: '12px',
          backgroundColor: 'var(--color-offwhite)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
        role="progressbar"
        aria-valuenow={totalCheckIns}
        aria-valuemin={0}
        aria-valuemax={requiredCheckIns}
        aria-label={`Trail progress: ${totalCheckIns} of ${requiredCheckIns} murals`}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: questComplete ? 'var(--color-teal)' : 'var(--color-coral)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 400ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>

      {/* Step dots — shows which of the 3 steps are done */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginTop: '0.75rem',
        }}
      >
        {Array.from({ length: requiredCheckIns }, (_, i) => (
          <div
            key={i}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-nav)',
              backgroundColor: i < totalCheckIns ? 'var(--color-teal)' : 'var(--color-offwhite)',
              color: i < totalCheckIns ? 'var(--color-white)' : 'var(--color-slate-light)',
              border: i < totalCheckIns ? 'none' : '1px solid var(--color-border)',
              transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {i < totalCheckIns ? '✓' : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

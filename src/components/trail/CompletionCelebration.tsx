/**
 * CompletionCelebration — Shown when the user completes all 3 check-ins.
 *
 * Displays:
 *   - A congratulations message
 *   - The redemption code (large and prominent)
 *   - Instructions to visit the gallery
 *   - A note that the code was also emailed
 *
 * DESIGN NOTE: This replaces the progress tracker in the UI when the quest
 * is complete. It should feel like a reward — bright colors, clear code display.
 *
 * C# ANALOGY: A Blazor component that renders conditionally when
 * ViewModel.QuestComplete == true, similar to a result/success page.
 */
'use client';

interface CompletionCelebrationProps {
  redemptionCode: string;
  email: string;
  onSignOut: () => void;
}

export default function CompletionCelebration({
  redemptionCode,
  email,
  onSignOut,
}: CompletionCelebrationProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-teal)',
      }}
    >
      {/* Celebration header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #145f70 0%, var(--color-teal) 100%)',
          padding: 'clamp(1.25rem, 3vw, 1.75rem)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '2.5rem',
            margin: '0 0 0.25rem',
            lineHeight: 1,
          }}
        >
          🎉
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-white)',
            margin: '0 0 0.25rem',
          }}
        >
          Trail Complete!
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
          }}
        >
          You explored 3 of Rachel Pierce&apos;s Sanibel murals
        </p>
      </div>

      {/* Code display + instructions */}
      <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
        {/* Redemption code box */}
        <div
          style={{
            backgroundColor: 'var(--color-teal-light)',
            border: '2px dashed var(--color-teal)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 0.25rem',
            }}
          >
            Your Redemption Code
          </p>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 700,
              color: 'var(--color-teal)',
              letterSpacing: '0.15em',
              margin: 0,
              // Prevent the code from wrapping on small screens
              wordBreak: 'keep-all',
            }}
          >
            {redemptionCode}
          </p>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              color: 'var(--color-slate-dark)',
              margin: '0 0 0.5rem',
            }}
          >
            How to Redeem
          </h4>
          <ol
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-slate)',
              lineHeight: 1.8,
              margin: 0,
              paddingLeft: '1.25rem',
            }}
          >
            <li>Visit <strong>Rachel Pierce Art Gallery</strong></li>
            <li>Show this page or the email to the cashier</li>
            <li>Receive your special gift!</li>
          </ol>
        </div>

        {/* Gallery address */}
        <div
          style={{
            backgroundColor: 'var(--color-offwhite)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1rem',
            marginBottom: '1rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-dark)',
              fontWeight: 600,
              margin: '0 0 0.25rem',
              letterSpacing: '0.04em',
            }}
          >
            📍 Rachel Pierce Art Gallery
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-slate)',
              margin: '0 0 0.375rem',
            }}
          >
            1571 Periwinkle Way, Sanibel, FL 33957
          </p>
          <a
            href="https://maps.google.com/?q=1571+Periwinkle+Way+Sanibel+FL+33957"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-coral)',
              textDecoration: 'none',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Get Directions →
          </a>
        </div>

        {/* Email note */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-slate-light)',
            margin: '0 0 1rem',
            lineHeight: 1.5,
          }}
        >
          This code was also emailed to <strong>{email}</strong>. You can show
          either this screen or the email at the gallery.
        </p>

        {/* Sign out */}
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
            padding: '0.25rem 0',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

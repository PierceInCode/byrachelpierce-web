/**
 * MuralCheckInCard — A single mural entry with a "check in" button.
 *
 * Renders the mural name, address, and a button to self-report a visit.
 * The button state changes based on whether the user has already checked in.
 *
 * States:
 *   - NOT checked in: Shows an active "I Visited!" button
 *   - Checked in: Shows a teal "Visited ✓" badge (disabled)
 *   - Currently checking in: Shows a loading spinner
 *
 * C# ANALOGY:
 *   A Blazor component with a [Parameter] for the mural data
 *   and an EventCallback for the check-in action.
 */
'use client';

import { useState } from 'react';

interface MuralCheckInCardProps {
  muralId: number;
  name: string;
  address: string;
  /** Whether this mural has already been checked in */
  isCheckedIn: boolean;
  /** Whether the user is authenticated (buttons are disabled when not signed in) */
  isAuthenticated: boolean;
  /** Called when the user taps "I Visited!" */
  onCheckIn: (muralId: number) => Promise<void>;
}

export default function MuralCheckInCard({
  muralId,
  name,
  address,
  isCheckedIn,
  isAuthenticated,
  onCheckIn,
}: MuralCheckInCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckIn() {
    if (isCheckedIn || isLoading || !isAuthenticated) return;
    setIsLoading(true);
    try {
      await onCheckIn(muralId);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem 1rem',
        backgroundColor: isCheckedIn ? 'var(--color-teal-light)' : 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: isCheckedIn
          ? '1px solid var(--color-teal)'
          : '1px solid var(--color-border)',
        transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Mural number badge */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: isCheckedIn ? 'var(--color-teal)' : 'var(--color-offwhite)',
          color: isCheckedIn ? 'var(--color-white)' : 'var(--color-slate)',
          fontFamily: 'var(--font-nav)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          border: isCheckedIn ? 'none' : '1px solid var(--color-border)',
        }}
      >
        {isCheckedIn ? '✓' : muralId}
      </div>

      {/* Mural info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--color-slate-dark)',
            margin: '0 0 0.125rem',
            lineHeight: 1.3,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: '0.75rem',
            color: 'var(--color-slate-light)',
            letterSpacing: '0.04em',
            margin: 0,
            // Truncate long addresses on small screens
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          📍 {address}
        </p>
      </div>

      {/* Check-in button */}
      {isAuthenticated && (
        <button
          onClick={handleCheckIn}
          disabled={isCheckedIn || isLoading}
          className={isCheckedIn ? '' : 'btn-coral'}
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            cursor: isCheckedIn || isLoading ? 'default' : 'pointer',
            backgroundColor: isCheckedIn
              ? 'var(--color-teal)'
              : isLoading
                ? 'var(--color-slate-light)'
                : 'var(--color-coral)',
            color: 'var(--color-white)',
            opacity: isLoading ? 0.7 : 1,
            minHeight: '36px',
            minWidth: '44px',
          }}
        >
          {isCheckedIn ? 'Visited ✓' : isLoading ? 'Saving…' : 'I Visited!'}
        </button>
      )}
    </div>
  );
}

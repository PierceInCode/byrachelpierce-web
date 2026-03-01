/**
 * EmailSignInForm — The email input + magic link trigger for trail sign-in.
 *
 * This component renders:
 *   1. An email input field
 *   2. A "Start My Trail" button
 *   3. Loading + success states
 *
 * When submitted, it calls the Auth.js signIn() endpoint with the Resend
 * provider, which sends a magic link email to the user.
 *
 * HOW AUTH.JS EMAIL SIGN-IN WORKS:
 *   - We POST to /api/auth/signin/resend with { email }
 *   - Auth.js generates a verification token, stores it via the adapter,
 *     and sends a magic link email through Resend
 *   - The user clicks the link → Auth.js verifies the token → creates a session
 *   - The page then reads the session to show trail progress
 *
 * C# ANALOGY:
 *   This is like a Razor component with an <EditForm> that calls
 *   UserManager.GenerateEmailConfirmationTokenAsync() on submit.
 *
 * NOTE: We don't use next-auth's signIn() client helper because it triggers
 * a full page redirect. Instead, we POST directly to the CSRF-protected
 * endpoint and handle the response ourselves for a smoother UX.
 */
'use client';

import { useState, type FormEvent } from 'react';

interface EmailSignInFormProps {
  /** Called after the magic link email is sent successfully */
  onEmailSent: () => void;
}

export default function EmailSignInForm({ onEmailSent }: EmailSignInFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic client-side validation (the server also validates)
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Get a CSRF token from Auth.js
      // Auth.js protects its endpoints with CSRF tokens. We need to fetch one
      // before POSTing to the sign-in endpoint.
      // (C# analogy: like getting an AntiForgery token before submitting a form)
      const csrfResponse = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      // Step 2: POST to Auth.js sign-in endpoint for the Resend provider
      // This tells Auth.js to generate a magic link and send it via Resend.
      const response = await fetch('/api/auth/signin/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          email: trimmedEmail,
          csrfToken,
          // callbackUrl tells Auth.js where to redirect after the magic link is clicked
          callbackUrl: '/murals/trail',
        }),
      });

      if (response.ok || response.redirected) {
        // Auth.js returns a redirect (302) on success when using email providers.
        // The magic link has been sent — tell the parent component.
        onEmailSent();
      } else {
        setError('Could not send the magic link. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(1.5rem, 3vw, 2rem)',
        border: '1px solid var(--color-border)',
        maxWidth: '480px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          color: 'var(--color-slate-dark)',
          margin: '0 0 0.5rem',
        }}
      >
        Join the Trail
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-slate)',
          lineHeight: 1.6,
          margin: '0 0 1.25rem',
        }}
      >
        Enter your email to start tracking your mural visits. We&apos;ll send you a magic link —
        no password needed.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label
          htmlFor="trail-email"
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-slate)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Email Address
        </label>
        <input
          id="trail-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          autoComplete="email"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-offwhite)',
            color: 'var(--color-slate-dark)',
            outline: 'none',
            width: '100%',
            transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-teal)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        />

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: '#d32f2f',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-coral"
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'var(--color-white)',
            backgroundColor: 'var(--color-coral)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '0.875rem 1.5rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            width: '100%',
          }}
        >
          {isSubmitting ? 'Sending Magic Link…' : 'Start My Trail →'}
        </button>
      </form>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          color: 'var(--color-slate-light)',
          margin: '0.75rem 0 0',
          lineHeight: 1.5,
        }}
      >
        We only use your email for the trail — no spam, no marketing. Your progress
        is saved so you can come back anytime.
      </p>
    </div>
  );
}

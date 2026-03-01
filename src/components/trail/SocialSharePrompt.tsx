/**
 * SocialSharePrompt — Encourages users to tag @byrachelpierce on social media.
 *
 * This is a lightweight, non-intrusive prompt that appears after each check-in
 * or at the bottom of the trail section. It's purely informational — no
 * tracking, no API calls, no gates. Just encouragement.
 *
 * DESIGN PHILOSOPHY: Per the spec, this is "marketing with fun."
 * We don't require social posting. We just make it easy and inviting.
 *
 * C# ANALOGY: A simple stateless Razor component — no logic, just markup.
 */
'use client';

export default function SocialSharePrompt() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-teal-light)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(1rem, 2.5vw, 1.5rem)',
        textAlign: 'center',
        border: '1px solid rgba(54, 181, 205, 0.2)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-slate-dark)',
          margin: '0 0 0.5rem',
        }}
      >
        📸 Snap a Selfie!
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-slate)',
          lineHeight: 1.6,
          margin: '0 0 0.75rem',
          maxWidth: '40ch',
          marginInline: 'auto',
        }}
      >
        Take a photo with each mural and share it on social media.
        Tag <strong style={{ color: 'var(--color-teal)' }}>@byrachelpierce</strong> on
        Instagram or Facebook — we love seeing your trail adventures!
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <a
          href="https://www.instagram.com/byrachelpierce/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-teal-dark)',
            letterSpacing: '0.05em',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-teal)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            minHeight: '44px',
          }}
        >
          Instagram →
        </a>
        <a
          href="https://www.facebook.com/byrachelpierce/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--color-teal-dark)',
            letterSpacing: '0.05em',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-teal)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            minHeight: '44px',
          }}
        >
          Facebook →
        </a>
      </div>
    </div>
  );
}

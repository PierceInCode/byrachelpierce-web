import Link from 'next/link';

interface EmptyStateProps {
  heading: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

export function EmptyState({ heading, body, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 'clamp(3rem, 6vw, 5rem) 1rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontSize: 'var(--text-xl)',
          color: 'var(--color-slate-dark)',
          marginBottom: '0.75rem',
        }}
      >
        {heading}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-slate)',
          lineHeight: 1.6,
          maxWidth: '40ch',
          marginInline: 'auto',
          marginBottom: '1.5rem',
        }}
      >
        {body}
      </p>
      <Link
        href={actionHref}
        className="btn-ghost-teal"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: 'var(--font-nav)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-teal)',
          border: '2px solid var(--color-teal)',
          borderRadius: 'var(--radius-full)',
          padding: '0.625rem 1.5rem',
          textDecoration: 'none',
          minHeight: '44px',
        }}
      >
        {actionLabel}
      </Link>
    </div>
  );
}

'use client';

/**
 * MobileNav — slide-out drawer for small screens.
 * Renders as an off-canvas overlay with the full navigation tree.
 * Uses the 'use client' directive because it manages open/close state.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { SHOP_URL, COLLECTION_CATEGORIES } from '@/lib/constants';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── External link icon (SVG inline for zero dependencies) ────────────────────
function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline', marginLeft: '0.25rem', verticalAlign: 'middle' }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus trap: return focus to trigger on close
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
        'button, a, input, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const linkStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-nav)',
    fontSize: 'var(--text-lg)',
    color: 'var(--color-white)',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    letterSpacing: '0.04em',
    minHeight: '44px',
    lineHeight: '1.4',
  };

  const subLinkStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-nav)',
    fontSize: 'var(--text-sm)',
    color: 'rgba(255,255,255,0.75)',
    padding: '0.5rem 0 0.5rem 1rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    letterSpacing: '0.04em',
    minHeight: '44px',
    lineHeight: '1.4',
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 49,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 280ms cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      {/* Slide-out drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(340px, 85vw)',
          backgroundColor: 'var(--color-teal)',
          zIndex: 50,
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
        }}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              background: 'none',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-white)',
              cursor: 'pointer',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation links */}
        <nav aria-label="Mobile navigation">
          <Link href="/" onClick={onClose} style={linkStyle}>
            Home
          </Link>

          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={linkStyle}
          >
            Shop <ExternalLinkIcon />
          </a>

          {/* Collection with category sub-links */}
          <Link href="/collection" onClick={onClose} style={linkStyle}>
            Collection
          </Link>
          <div style={{ marginBottom: '0.25rem' }}>
            {COLLECTION_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collection/${cat.slug}`}
                onClick={onClose}
                style={subLinkStyle}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          <Link href="/story" onClick={onClose} style={linkStyle}>
            Story
          </Link>
          <Link href="/murals" onClick={onClose} style={linkStyle}>
            Murals
          </Link>
          <Link href="/visit" onClick={onClose} style={linkStyle}>
            Events &amp; Visit
          </Link>
          <Link href="/contact" onClick={onClose} style={linkStyle}>
            Contact
          </Link>
        </nav>

        {/* Footer area inside drawer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            1571 Periwinkle Way
            <br />
            Sanibel Island, FL 33957
          </p>
        </div>
      </div>
    </>
  );
}

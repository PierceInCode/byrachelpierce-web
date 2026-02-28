'use client';

/**
 * Header — sticky site header with full desktop navigation and mobile hamburger.
 * Uses 'use client' because mobile nav state (open/close) is managed here.
 *
 * Desktop: horizontal nav with Collection dropdown
 * Mobile: hamburger button → MobileNav slide-out drawer
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SHOP_URL, COLLECTION_CATEGORIES } from '@/lib/constants';
import MobileNav from './MobileNav';

// ── Icon components ─────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle', opacity: 0.8 }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ChevronDownIcon() {
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
      style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle', opacity: 0.7 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const navLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-nav)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.92)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '0.375rem 0.625rem',
  borderRadius: 'var(--radius-sm)',
  whiteSpace: 'nowrap',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  textDecoration: 'none',
};

// ── Collection Dropdown ──────────────────────────────────────────────────

function CollectionDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Split categories into two columns for the dropdown
  const half = Math.ceil(COLLECTION_CATEGORIES.length / 2);
  const col1 = COLLECTION_CATEGORIES.slice(0, half);
  const col2 = COLLECTION_CATEGORIES.slice(half);

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={navLinkStyle}
      >
        Collection
        <ChevronDownIcon />
      </button>

      {/* Dropdown panel */}
      <div
        role="menu"
        style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: '50%',
          transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1rem',
          minWidth: '380px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.125rem',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
          zIndex: 100,
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Column 1 */}
        <div>
          {col1.map((cat) => (
            <Link
              key={cat.slug}
              href={`/collection/${cat.slug}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-slate)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.04em',
                transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-teal-light)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-teal-dark)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-slate)';
              }}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Column 2 */}
        <div>
          {col2.map((cat) => (
            <Link
              key={cat.slug}
              href={`/collection/${cat.slug}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-slate)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.04em',
                transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-teal-light)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-teal-dark)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-slate)';
              }}
            >
              {cat.label}
            </Link>
          ))}
          {/* View All link */}
          <Link
            href="/collection"
            role="menuitem"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--color-teal)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '0.04em',
              marginTop: '0.5rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.75rem',
              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-hotpink)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-teal)';
            }}
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const simpleNavLinks = [
    { label: 'Story', href: '/story' },
    { label: 'Murals', href: '/murals' },
    { label: 'Events & Visit', href: '/visit' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          backgroundColor: 'var(--color-teal)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        }}
      >
        <div
          className="container-site"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '68px',
          }}
        >
          {/* ── Logo / Wordmark ── */}
          <Link
            href="/"
            aria-label="by Rachel Pierce — home"
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              fontWeight: 600,
              color: 'var(--color-white)',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              lineHeight: 1.1,
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 300, opacity: 0.85 }}>by</span>{' '}
            <span>Rachel Pierce</span>
          </Link>

          {/* ── Desktop Navigation ── */}
          <nav
            aria-label="Primary navigation"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
            className="desktop-nav"
          >
            {/* Home */}
            <Link href="/" style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-white)'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.92)'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; }}
            >
              Home
            </Link>

            {/* Shop — external link, opens new tab */}
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-white)'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.92)'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; }}
            >
              Shop <ExternalLinkIcon />
            </a>

            {/* Collection with dropdown */}
            <CollectionDropdown />

            {/* Remaining links */}
            {simpleNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={navLinkStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-white)'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.92)'; (e.currentTarget as HTMLAnchorElement).style.backgroundColor = ''; }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="mobile-menu-btn"
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
              flexShrink: 0,
            }}
          >
            <HamburgerIcon />
          </button>
        </div>
      </header>

      {/* ── Responsive visibility styles ── */}
      <style>{`
        /* Show desktop nav, hide hamburger on large screens */
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        /* Hide desktop nav, show hamburger on small screens */
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      {/* ── Mobile Drawer ── */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

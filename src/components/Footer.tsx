/**
 * Footer — full-width footer with three-column layout, social links,
 * cross-sell module, and legal bar.
 * This is a Server Component.
 */

import Link from 'next/link';
import CrossSellModule from './CrossSellModule';
import { SHOP_URL, GALLERY_ADDRESS, SOCIAL, SITE_NAME } from '@/lib/constants';

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
      style={{ display: 'inline', marginLeft: '3px', verticalAlign: 'middle', opacity: 0.7 }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Social icons (simple SVG paths) ──────────────────────────────────

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  );
}

// ── Footer column heading style ───────────────────────────────────────────────

const colHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-nav)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  marginBottom: '1rem',
};

const footerLinkStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'rgba(255,255,255,0.82)',
  textDecoration: 'none',
  marginBottom: '0.5rem',
  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
  lineHeight: 1.5,
  minHeight: '28px',
};

// ── Footer ────────────────────────────────────────────────────────────

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer aria-label="Site footer">
      {/* Cross-sell module sits just above footer background */}
      <CrossSellModule />

      {/* Main footer body */}
      <div style={{ backgroundColor: 'var(--color-teal)' }}>
        <div className="container-site">
          {/* Three-column grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'clamp(2rem, 5vw, 4rem)',
              paddingTop: 'clamp(3rem, 6vw, 5rem)',
              paddingBottom: 'clamp(2rem, 4vw, 3rem)',
            }}
          >
            {/* ── Column 1: SHOP ── */}
            <div>
              <p style={colHeadingStyle}>Shop</p>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={footerLinkStyle}
              >
                Visit Store <ExternalLinkIcon />
              </a>
              <Link href="/custom" style={footerLinkStyle}>
                Custom Orders
              </Link>
              <Link href="/ar" style={footerLinkStyle}>
                AR Sizing Tool
              </Link>
            </div>

            {/* ── Column 2: EXPLORE ── */}
            <div>
              <p style={colHeadingStyle}>Explore</p>
              <Link href="/story" style={footerLinkStyle}>
                Story
              </Link>
              <Link href="/collection" style={footerLinkStyle}>
                Collection
              </Link>
              <Link href="/murals" style={footerLinkStyle}>
                Murals
              </Link>
              <Link href="/murals/trail" style={footerLinkStyle}>
                Mural Selfie Trail
              </Link>
              <Link href="/visit" style={footerLinkStyle}>
                Events &amp; Visit
              </Link>
              <Link href="/press" style={footerLinkStyle}>
                Press
              </Link>
            </div>

            {/* ── Column 3: CONNECT ── */}
            <div>
              <p style={colHeadingStyle}>Connect</p>

              {/* Social links with icons */}
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Rachel Pierce on Instagram"
                style={{ ...footerLinkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <InstagramIcon /> Instagram
              </a>
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Rachel Pierce on Facebook"
                style={{ ...footerLinkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FacebookIcon /> Facebook
              </a>
              <a
                href={SOCIAL.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Rachel Pierce on YouTube"
                style={{ ...footerLinkStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <YoutubeIcon /> YouTube
              </a>

              {/* Newsletter */}
              <div style={{ marginTop: '1.25rem' }}>
                <p style={{ ...colHeadingStyle, marginBottom: '0.75rem' }}>Newsletter</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.65)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  Studio updates, new work, and island stories — straight to your inbox.
                </p>
                <Link
                  href="/contact"
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-teal)',
                    backgroundColor: 'var(--color-white)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
                    minHeight: '36px',
                    lineHeight: '1.4',
                  }}
                >
                  Sign Up
                </Link>
              </div>

              <Link href="/contact" style={{ ...footerLinkStyle, marginTop: '1rem' }}>
                Contact
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                paddingTop: '1.5rem',
              }}
            >
              {/* Copyright */}
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xs)',
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0,
                }}
              >
                © {year} {SITE_NAME}, LLC. All rights reserved.
              </p>

              {/* Address */}
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {GALLERY_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

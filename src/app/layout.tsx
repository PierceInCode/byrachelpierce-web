/**
 * Root Layout — wraps every page with fonts, metadata and analytics.
 * Google Fonts are loaded via next/font/google for zero-CLS font loading.
 * This is a Server Component.
 *
 * The Header and Footer are NOT here: the home page is the full-screen
 * mosaic and draws its own chrome. Every other page gets them from
 * src/app/(site)/layout.tsx.
 */

import type { Metadata } from 'next';
import { Playfair_Display, Jura } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { artUrl } from '@/lib/art-url';

// ── Google Font Loading ──────────────────────────────────────────────────────────────
// next/font/google injects optimized, self-hosted font CSS with no CLS.

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
});

const jura = Jura({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jura',
});

// ── Site-wide Metadata ───────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    template: '%s | by Rachel Pierce',
    default: 'by Rachel Pierce | Original Art on Sanibel Island',
  },
  description:
    'Original paintings, prints, and murals by Rachel Pierce. Visit our gallery on Sanibel Island, Florida.',
  metadataBase: new URL('https://byrachelpierce.com'),
  // The tab icon is the blue crab the Wix site used. Image binaries stay out of
  // git (they live with the artwork), so there is no favicon.ico in the repo.
  icons: {
    icon: [
      { url: artUrl('site/icon-32.png'), sizes: '32x32', type: 'image/png' },
      { url: artUrl('site/icon-192.png'), sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: artUrl('site/apple-icon-180.png'), sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    siteName: 'by Rachel Pierce',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Attach font CSS variables to <html> so they cascade everywhere
      className={`${playfairDisplay.variable} ${jura.variable}`}
      style={
        {
          // Override the @theme font values with the loaded Google Font variables
          // so the actual font files are used instead of fallback stack names.
          // This ensures next/font optimization is respected.
          // (Tailwind v4 @theme values serve as fallbacks when fonts aren't loaded.)
        }
      }
    >
      <head>
        {/*
         * next/font/google handles preloading automatically.
         * No <link rel="stylesheet"> needed for fonts.
         */}
      </head>
      <body
        style={{
          // Apply the loaded font variables to override the CSS stack
          fontFamily: 'var(--font-body)',
        }}
      >
        {children}
        {/* Vercel Analytics — production page-view telemetry (M1 / R5). */}
        <Analytics />
      </body>
    </html>
  );
}

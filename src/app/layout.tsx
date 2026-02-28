/**
 * Root Layout — wraps every page with fonts, metadata, Header, and Footer.
 * Google Fonts are loaded via next/font/google for zero-CLS font loading.
 * This is a Server Component.
 */

import type { Metadata } from 'next';
import { Playfair_Display, Jura } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
      style={{
        // Override the @theme font values with the loaded Google Font variables
        // so the actual font files are used instead of fallback stack names.
        // This ensures next/font optimization is respected.
        // (Tailwind v4 @theme values serve as fallbacks when fonts aren't loaded.)
      }}
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
        {/*
         * The header is fixed/sticky, so pages need top padding.
         * The 68px offset matches the header height set in Header.tsx.
         */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100dvh',
          }}
        >
          <Header />

          {/* Page content — pushed below the fixed 68px header */}
          <main
            id="main-content"
            style={{ flex: 1, paddingTop: '68px' }}
            tabIndex={-1}
          >
            {children}
          </main>

          <Footer />
        </div>
      </body>
    </html>
  );
}

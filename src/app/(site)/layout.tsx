/**
 * Layout for every page except the home page: the site Header, the page
 * content pushed below it, and the Footer.
 *
 * `(site)` is a route group, so it adds nothing to the URLs: this folder's
 * `collection/page.tsx` is still served at `/collection`. The home page sits
 * outside the group because the mosaic is full-screen and draws its own
 * chrome (see src/app/page.tsx).
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}
    >
      <Header />

      {/*
       * The header is fixed/sticky, so pages need top padding.
       * The 68px offset matches the header height set in Header.tsx.
       */}
      <main id="main-content" style={{ flex: 1, paddingTop: '68px' }} tabIndex={-1}>
        {children}
      </main>

      <Footer />
    </div>
  );
}

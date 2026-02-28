# by Rachel Pierce — Next.js Website

Marketing and experience website for the by Rachel Pierce art gallery on Sanibel Island, Florida.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-first config via `@import 'tailwindcss'` + `@theme` block)
- **Fonts**: Playfair Display (headings), Jura (navigation), system sans-serif (body)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Brand

| Token | Value | Usage |
|---|---|---|
| `--color-teal` | `#36B5CD` | Header, footer, accents |
| `--color-coral` | `#FD8473` | CTA buttons |
| `--color-hotpink` | `#FF008C` | Hover states |
| `--color-slate` | `#577083` | Body text |
| `--font-heading` | Playfair Display | All headings (h1–h6) |
| `--font-nav` | Jura | Navigation items |
| `--font-body` | Avenir / Helvetica Neue / Arial | Body copy |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── globals.css       # Tailwind v4 + brand tokens
│   ├── layout.tsx        # Root layout (Header + Footer)
│   ├── page.tsx          # Homepage
│   ├── story/            # Artist biography
│   ├── collection/       # Art gallery (placeholder)
│   ├── murals/           # Mural hub + trail
│   ├── visit/            # Events & visit info
│   ├── contact/          # Contact form
│   ├── press/            # Press & media
│   ├── custom/           # Custom orders
│   └── ar/               # AR Sizing Tool (coming soon)
├── components/           # Shared UI components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── CrossSellModule.tsx
│   └── MobileNav.tsx
├── lib/
│   ├── constants.ts      # Site-wide constants
│   └── mural-data.ts     # 14 mural locations + coordinates
└── types/
    └── index.ts          # Shared TypeScript types
```

## External Links

- **Shop (Lightspeed)**: https://store33134078.company.site/
- **Pierce's Paw Paradise**: https://www.piercespawparadise.com
- **Home by Rachel Pierce**: https://www.homebyrachelpierce.com

## Gallery Location

1571 Periwinkle Way, Sanibel Island, FL 33957

## Notes

- This is a **marketing/experience site** — no e-commerce, no cart
- The Shop link opens in a new tab (external Lightspeed store)
- AR Sizing Tool is a coming-soon feature (UI placeholder only)
- 14 mural locations are seeded in `lib/mural-data.ts` for future map integration

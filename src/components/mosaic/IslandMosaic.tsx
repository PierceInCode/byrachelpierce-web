'use client';

/**
 * The home page: Sanibel, made of every painting in the collection.
 *
 * This component renders the markup once. Everything that moves or changes
 * afterwards (the map, which panel is open, the painting viewer) is driven
 * by ./engine, which finds these elements by their `data-m` names. Nothing
 * here holds React state, so React never re-renders over the engine's work.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { GALLERY_ADDRESS, SHOP_URL } from '@/lib/constants';
import { ABOUT_PARAGRAPHS, SOCIAL_LINKS, WATCH_LINKS } from '@/lib/mosaic/content';
import { createMosaic, type MosaicData } from './engine';
import './mosaic.css';

export interface IslandMosaicProps extends MosaicData {
  /** The small photograph on the Visit panel. */
  galleryPhotoUrl: string;
  year: number;
}

const TABS = [
  ['paintings', 'Paintings'],
  ['murals', 'Murals'],
  ['giving', 'Giving'],
  ['watch', 'Watch'],
  ['visit', 'Visit'],
  ['contact', 'Contact'],
  ['about', 'About'],
] as const;

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.6 21v-7.6h2.5l.4-3h-2.9V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.6V21z"
      />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="4.6" />
      <circle cx="12" cy="12" r="3.7" />
      <circle cx="16.7" cy="7.3" r=".9" fill="currentColor" stroke="none" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 7.6a2.5 2.5 0 0 0-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.6C2 9.2 2 12 2 12s0 2.8.4 4.4a2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.4.4-4.4s0-2.8-.4-4.4ZM10 15V9l5.2 3L10 15Z"
      />
    </svg>
  ),
};

export default function IslandMosaic({ galleryPhotoUrl, year, ...data }: IslandMosaicProps) {
  const root = useRef<HTMLDivElement>(null);
  // The engine reads its data once, when it starts.
  const initial = useRef(data);

  useEffect(() => {
    if (!root.current) return;
    document.documentElement.classList.add('mosaic-page');
    const destroy = createMosaic(root.current, initial.current);
    return () => {
      destroy();
      document.documentElement.classList.remove('mosaic-page');
    };
  }, []);

  const [street, ...rest] = GALLERY_ADDRESS.split(', ');

  return (
    <div className="mosaic" ref={root}>
      <canvas
        className="map"
        data-m="map"
        role="application"
        aria-label={`Sanibel Island made from ${data.layout.tiles.length} paintings by Rachel Pierce. Drag to move, pinch or scroll to zoom, tap a tile to open the painting.`}
      />

      <header className="top">
        <Link className="name" href="/">
          Rachel Pierce<small>Sanibel Island, Florida</small>
        </Link>
        <div className="r">
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer">
            Shop
          </a>
          <span className="north" data-m="north" aria-label="North">
            <span>N</span>
            <svg viewBox="0 0 22 12" aria-hidden="true">
              <path
                d="M1 6h19M15 1.5 20 6l-5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </header>

      {/* A plain <img>: the engine sizes and places it against the panel, which next/image cannot follow. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="her" data-m="her" src={data.photoUrl} alt="Rachel Pierce seated in a chair" />
      <p className="hint sm" data-m="hint" />
      <div className="tip sm" data-m="tip" />
      <div className="zoom">
        <button data-m="zoom-in" aria-label="Zoom in">
          +
        </button>
        <button data-m="zoom-out" aria-label="Zoom out">
          &minus;
        </button>
      </div>

      <section className="sheet" data-m="sheet">
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={id === 'paintings'} data-tab={id}>
              {label}
            </button>
          ))}
        </div>
        <div className="panes">
          <div className="pane" data-pane="paintings">
            <h1>Hundreds of paintings, one island.</h1>
            <p>
              Every tile is a painting by Rachel Pierce, set on the real coastline of Sanibel.
              Lighthouses sit at the point, birds by the refuge, turtles and shells along the Gulf.
            </p>
            <Link className="lnk go" href="/collection">
              Browse the whole collection
            </Link>
          </div>

          <div className="pane" data-pane="murals" hidden>
            <h2>Fourteen walls she has painted.</h2>
            <div className="rows" data-m="murals">
              {data.murals.map((mural, i) => (
                <button key={mural.name} data-i={i}>
                  <span className="t">{mural.name}</span>
                  <span className="n sm">{i + 1}</span>
                </button>
              ))}
            </div>
            <Link className="lnk go" href="/murals/trail">
              Start the mural trail
            </Link>
          </div>

          <div className="pane" data-pane="giving" hidden>
            <h2>What she gives back.</h2>
            <div className="rows" data-m="giving">
              {data.causes.map((cause, i) => [
                <button key={cause.name} data-i={i}>
                  <span className="t">{cause.name}</span>
                  <span className="n sm">{cause.at ? 'On the island' : ''}</span>
                </button>,
                <p key={`${cause.name}-text`} className="d sm">
                  {cause.text}
                </p>,
              ])}
            </div>
          </div>

          <div className="pane" data-pane="watch" hidden>
            <h2>Watch her paint.</h2>
            <div className="rows">
              {WATCH_LINKS.map((link) => (
                <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer">
                  <span className="t">{link.name}</span>
                  <span className="n sm">{link.note}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="pane" data-pane="visit" hidden>
            <h2>Come and say hello.</h2>
            <div className="visit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={galleryPhotoUrl} alt="Rachel Pierce sitting in her gallery" />
              <div>
                <address>
                  Rachel Pierce Art Gallery
                  <br />
                  {street}
                  <br />
                  {rest.join(', ').replace(', FL ', ', Florida ')}
                </address>
                <p className="links">
                  <Link className="lnk" href="/visit">
                    Hours and directions
                  </Link>
                  <a className="lnk" href={SHOP_URL} target="_blank" rel="noopener noreferrer">
                    Shop prints and originals
                  </a>
                  <Link className="lnk" href="/custom">
                    Commission a painting
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="pane" data-pane="about" hidden>
            <h2>About Rachel.</h2>
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Link className="lnk go" href="/story">
              Read her story
            </Link>
          </div>

          <div className="pane" data-pane="contact" hidden>
            <h2>Get in touch.</h2>
            <form className="form" data-m="contact">
              <label>
                Name
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Message
                <textarea name="message" rows={3} required />
              </label>
              <button type="submit">Send message</button>
              <p className="note sm" data-m="sent" hidden>
                This is a preview, so the form is not connected yet and nothing was sent.
              </p>
            </form>
          </div>
        </div>
      </section>

      <p className="copy">&copy; {year} Rachel Pierce. All rights reserved.</p>
      <nav className="social" data-m="social" aria-label="Social media">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Rachel Pierce on ${link.name}`}
          >
            {SOCIAL_ICONS[link.name]}
          </a>
        ))}
      </nav>

      <div className="look" data-m="look" role="dialog" aria-label="Painting">
        <div className="nav">
          <button data-m="prev">Previous</button>
          <button data-m="next">Next</button>
        </div>
        <button className="x" data-m="shut">
          Close
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-m="big" alt="" />
        <p className="cap">
          <b data-m="cap" />
          <a className="lnk sm" data-m="more" href="#">
            See it in the collection
          </a>
        </p>
      </div>
    </div>
  );
}

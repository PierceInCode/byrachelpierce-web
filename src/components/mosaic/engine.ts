/**
 * The home-page mosaic's canvas: Sanibel drawn from one tile per painting,
 * with a camera you can drag, pinch and zoom, and the panel's views (murals,
 * causes, the gallery) shown as places on the same island.
 *
 * This is deliberately imperative. IslandMosaic.tsx renders the markup once
 * and never re-renders it; everything that changes afterwards (which view is
 * open, where Rachel's picture sits, the painting viewer) is done here on the
 * elements it finds by their `data-m` names.
 */

import { displayTitle } from '@/lib/mosaic/titles';
import { ease, tween, type Tween } from '@/lib/mosaic/tween';
import type { WorldPoint } from '@/lib/mosaic/geo';
import type { MosaicLayout, MosaicPin } from '@/lib/mosaic/types';

export interface MosaicData {
  layout: MosaicLayout;
  /** Sanibel's and Captiva's outlines as SVG paths in world units. */
  islandPath: string;
  captivaPath: string;
  atlasUrl: string;
  /** Folders holding each painting's thumbnail and full image, without a trailing slash. */
  thumbBase: string;
  webBase: string;
  logoUrl: string;
  /**
   * The photograph of Rachel. Wide screens show it as an element beside the
   * map; narrow screens draw it on the canvas so the island can overlap it.
   */
  photoUrl: string;
  murals: MosaicPin[];
  causes: MosaicPin[];
  gallery: WorldPoint;
}

type Mode = 'paintings' | 'murals' | 'giving' | 'watch' | 'visit' | 'contact' | 'about';

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Camera extends Record<string, number> {
  x: number;
  y: number;
  z: number;
}

/** Wide screens get the side-panel layout; narrower ones the bottom drawer. */
const WIDE = 900;
const WATERS: [string, number, number][] = [['San Carlos Bay', 905, 150]];

export function createMosaic(root: HTMLElement, data: MosaicData): () => void {
  const q = <T extends Element>(name: string): T => {
    const el = root.querySelector<T>(`[data-m="${name}"]`);
    if (!el) throw new Error(`mosaic: missing element "${name}"`);
    return el;
  };
  const canvas = q<HTMLCanvasElement>('map');
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const ctx = context;
  const sheet = q<HTMLElement>('sheet');
  const her = q<HTMLImageElement>('her');
  const hint = q<HTMLElement>('hint');
  const tipEl = q<HTMLElement>('tip');
  const north = q<HTMLElement>('north');
  const social = q<HTMLElement>('social');
  const look = q<HTMLElement>('look');
  const big = q<HTMLImageElement>('big');
  const cap = q<HTMLElement>('cap');
  const more = q<HTMLAnchorElement>('more');
  const sent = q<HTMLElement>('sent');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  const panes = [...root.querySelectorAll<HTMLElement>('[data-pane]')];

  const { layout } = data;
  const cells = layout.cells;
  const N = cells.length;
  const cs = layout.cellSize;
  const T = layout.atlasTile;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const abort = new AbortController();
  const on = { signal: abort.signal };
  const coast = new Path2D(data.islandPath);
  const around = [new Path2D(data.captivaPath)];
  const title = (i: number): string => displayTitle(layout.tiles[i].title);
  const isWide = (): boolean => window.innerWidth >= WIDE;

  // ---------- state ----------
  let W = 0;
  let H = 0;
  let dpr = 1;
  let portrait = false;
  const cam: Camera = { x: 500, y: 240, z: 1 };
  let zHome = 0;
  let mode: Mode = 'paintings';
  let active = -1;
  let hover = -1;
  let pin = -1;
  const dim = { v: 0 };
  const intro = { t: still ? 1 : 0 };
  /** On phones the island moves over to make room for Rachel beside the lists. */
  let shift = 0;
  let destroyed = false;
  const tweens = new Set<Tween>();
  const run = <S extends Record<string, number>>(
    target: S,
    to: Partial<S>,
    options: Parameters<typeof tween>[2],
  ): Tween => {
    const t = tween(target, to, options);
    tweens.add(t);
    return t;
  };

  /** Murals, Giving, Watch, Contact and About share one panel size and keep her picture. */
  const side = (): boolean => mode !== 'paintings' && mode !== 'visit';
  const pins = (): MosaicPin[] => (mode === 'murals' ? data.murals : data.causes);

  // ---------- images ----------
  const load = (src: string, done: () => void): HTMLImageElement => {
    const image = new Image();
    image.onload = () => {
      if (!destroyed) done();
    };
    image.src = src;
    return image;
  };
  let atlasReady = false;
  let logoReady = false;
  let photoReady = false;
  const atlas = load(data.atlasUrl, () => {
    atlasReady = true;
    draw();
  });
  const logo = load(data.logoUrl, () => {
    logoReady = true;
    draw();
  });
  const photo = load(data.photoUrl, () => {
    photoReady = true;
    resize();
  });
  /** Sharper tiles, fetched only for what is on screen when zoomed in. */
  const sharpTiles = new Map<number, { image: HTMLImageElement; ok: boolean }>();
  let loading = 0;

  // ---------- camera ----------
  /** The part of the screen not covered by the panel. */
  const frame = (): Frame => {
    const r = sheet.getBoundingClientRect();
    return isWide()
      ? { x: r.right + 30, y: 70, w: W - r.right - 60, h: H - 110 }
      : { x: 10 + shift, y: 64, w: W - 20 - shift, h: Math.max(160, r.top - 78) };
  };
  // The island is twice as wide as it is tall, so on upright phones the map is
  // turned a quarter turn to fill the screen.
  const rot = (x: number, y: number): WorldPoint => (portrait ? [-y, x] : [x, y]);
  const unrot = (x: number, y: number): WorldPoint => (portrait ? [y, -x] : [x, y]);
  const toScreen = (x: number, y: number): WorldPoint => {
    const f = frame();
    const [rx, ry] = rot(x, y);
    const [cx, cy] = rot(cam.x, cam.y);
    return [f.x + f.w / 2 + (rx - cx) * cam.z, f.y + f.h / 2 + (ry - cy) * cam.z];
  };
  const toWorld = (sx: number, sy: number): WorldPoint => {
    const f = frame();
    const [cx, cy] = rot(cam.x, cam.y);
    return unrot((sx - f.x - f.w / 2) / cam.z + cx, (sy - f.y - f.h / 2) / cam.z + cy);
  };
  const home = (): Camera => {
    const f = frame();
    const islandW = portrait ? 480 : 1010;
    const islandH = portrait ? 1010 : 480;
    zHome = Math.min(f.w / islandW, f.h / islandH) * 0.97;
    return { x: 502, y: 239, z: zHome };
  };
  const clampCam = (): void => {
    cam.z = Math.max(zHome * 0.8, Math.min(16, cam.z));
    cam.x = Math.max(-40, Math.min(1050, cam.x));
    cam.y = Math.max(-40, Math.min(520, cam.y));
  };
  let fly: Tween | null = null;
  const flyTo = (x: number, y: number, z: number, seconds = 1.4): void => {
    fly?.kill();
    fly = run(
      cam,
      { x, y, z },
      { duration: still ? 0 : seconds, ease: ease.power3InOut, onUpdate: draw },
    );
  };

  // ---------- Rachel's picture, the panel and the pieces placed around them ----------
  let herRoom = false;
  let herOn: boolean | null = null;
  let herBox: [number, number, number, number] = [0, 0, 0, 0];
  const herAlpha = { a: 0 };
  const sheetHeights = new Map<string, number>();

  /** The side views share one panel height (Giving at rest); a longer list scrolls inside it. */
  function sizeSheet(): void {
    sheet.style.height = '';
    if (!side()) return;
    if (isWide()) sheet.style.width = '';
    const key = `${window.innerWidth}x${window.innerHeight}`;
    let height = sheetHeights.get(key);
    if (height === undefined) {
      const wasHidden = panes.map((p) => p.hidden);
      const rows = [...q<HTMLElement>('giving').querySelectorAll('button')];
      const current = rows.map((b) => b.getAttribute('aria-current'));
      panes.forEach((p) => {
        p.hidden = p.dataset.pane !== 'giving';
      });
      rows.forEach((b) => b.removeAttribute('aria-current'));
      height = sheet.getBoundingClientRect().height;
      sheetHeights.set(key, height);
      panes.forEach((p, i) => {
        p.hidden = wasHidden[i];
      });
      rows.forEach((b, i) => {
        const value = current[i];
        if (value) b.setAttribute('aria-current', value);
      });
    }
    sheet.style.height = `${height}px`;
  }

  function placeHer(): void {
    sizeSheet();
    const wide = isWide();
    const r = sheet.getBoundingClientRect();
    let w = 0;
    let h = 0;
    let l = 0;
    let t = 0;
    if (wide) {
      // The photograph fills the column from just under the header down to the
      // panel. On the home view the panel widens to match it; in the other
      // views the photograph fits the panel instead.
      const top = 92;
      const grow = mode === 'paintings';
      let rr = r;
      for (let k = 0; k < 2; k++) {
        h = Math.min(800, rr.top - 20 - top);
        w = Math.min(grow ? 500 : rr.width, h * 0.687);
        if (grow) sheet.style.width = w > 400 ? `${w}px` : '';
        rr = sheet.getBoundingClientRect();
      }
      h = Math.min(rr.top - 20 - top, w / 0.687);
      w = h * 0.687;
      t = rr.top - 20 - h;
      l = rr.left;
      herRoom = h >= 240;
    } else {
      // Smaller beside the lists, where the island has less room.
      const ratio = photoReady ? photo.naturalWidth / photo.naturalHeight : 0.687;
      const list = side();
      w = list ? Math.min(150, W * 0.31) : Math.min(230, W * 0.44);
      h = w / ratio;
      l = W * (list ? 0.015 : 0.03);
      t = 70;
      herRoom = r.top > t + h * 0.8;
      herBox = [l, t, w, h];
      sheet.style.width = '';
    }
    her.style.display = wide ? '' : 'none';
    shift = !wide && herRoom && side() ? herBox[2] * 0.7 : 0;

    // Social links sit beside the panel on wide screens, level with its top
    // and clear of the copyright line; on phones they sit just above it.
    const sr = sheet.getBoundingClientRect();
    if (wide) {
      Object.assign(social.style, {
        left: `${sr.right + 12}px`,
        right: '',
        top: `${sr.top}px`,
        bottom: '',
      });
    } else {
      Object.assign(social.style, { left: '', right: '12px', bottom: '', top: `${sr.top - 52}px` });
    }
    // The hint sits against the zoom buttons on wide screens, at the left on phones.
    const f = frame();
    hint.style.left = wide ? 'auto' : '16px';
    hint.style.right = wide ? '84px' : 'auto';
    hint.style.top = `${f.y + f.h - 8}px`;
    Object.assign(her.style, {
      left: `${l}px`,
      top: `${t}px`,
      width: `${Math.max(0, w)}px`,
      height: `${Math.max(0, h)}px`,
    });
  }

  /** She steps aside when there is no room, on Visit, or once you zoom into the paintings. */
  function showHer(): void {
    const visible =
      herRoom &&
      intro.t >= 1 &&
      (side() || (mode === 'paintings' && cam.z <= zHome * 1.25 && ptrs.size === 0));
    if (visible === herOn) return;
    herOn = visible;
    her.style.opacity = visible ? '1' : '0';
    run(herAlpha, { a: visible ? 1 : 0 }, { duration: still ? 0 : 0.7, onUpdate: draw });
  }

  // The logo is anchored on the map at the middle of the open water beside the
  // island, worked out once per window size against the home layout.
  let logoAt: WorldPoint = [630, 72];
  function placeLogo(): void {
    if (mode !== 'paintings') return;
    const hc = home();
    const f = frame();
    const shoreNear = (at: number, span: number): number => {
      let north = 1e9;
      for (const c of cells) if (Math.abs(c[0] - at) < span && c[1] < north) north = c[1];
      return north - cs / 2;
    };
    if (isWide()) {
      // Halfway between the header and the north shore, over the middle of the island.
      const x = 630;
      const topWorld = hc.y + (70 - f.y - f.h / 2) / hc.z;
      logoAt = [x, (topWorld + shoreNear(x, 150)) / 2];
    } else {
      // Map turned: halfway down the open water, and halfway between the shore and the screen edge.
      const yMid = (f.y + sheet.getBoundingClientRect().top - 60) / 2;
      const x = hc.x + (yMid - f.y - f.h / 2) / hc.z;
      const shoreScreenX = f.x + f.w / 2 + (hc.y - shoreNear(x, 60)) * hc.z;
      logoAt = [x, hc.y - ((shoreScreenX + W) / 2 - f.x - f.w / 2) / hc.z];
    }
  }

  function resize(): void {
    if (destroyed) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    portrait = W < WIDE && H > W;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    north.toggleAttribute('data-up', !portrait);
    hint.textContent = window.matchMedia('(hover: hover)').matches
      ? 'Scroll, drag, click'
      : 'Pinch, drag, tap';
    const wasHome = zHome === 0 || cam.z <= zHome * 1.02;
    placeHer();
    placeLogo();
    if (wasHome) Object.assign(cam, home());
    else home();
    draw();
  }

  // ---------- drawing ----------
  // Each tile starts scattered and settles into place, west to east.
  const seed = cells.map((c, i): [number, number, number] => {
    const angle = (((i * 2654435761) % 1000) / 1000) * Math.PI * 2;
    const distance = 260 + ((i * 40503) % 700);
    return [Math.cos(angle) * distance, Math.sin(angle) * distance, (c[0] / 1010) * 0.62];
  });
  const settle = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);
  let queued = false;
  let frameId = 0;
  function draw(): void {
    if (queued || destroyed) return;
    queued = true;
    frameId = requestAnimationFrame(paint);
  }

  const setMapTransform = (): void => {
    const f = frame();
    const [cx, cy] = rot(cam.x, cam.y);
    const ox = f.x + f.w / 2 - cx * cam.z;
    const oy = f.y + f.h / 2 - cy * cam.z;
    if (portrait) ctx.setTransform(0, cam.z * dpr, -cam.z * dpr, 0, ox * dpr, oy * dpr);
    else ctx.setTransform(cam.z * dpr, 0, 0, cam.z * dpr, ox * dpr, oy * dpr);
  };
  const resetTransform = (): void => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const drawTile = (i: number, x: number, y: number, side2: number, sharp: boolean): void => {
    const entry = sharp ? sharpTiles.get(i) : undefined;
    if (entry?.ok) {
      const image = entry.image;
      const m = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(
        image,
        (image.naturalWidth - m) / 2,
        (image.naturalHeight - m) / 2,
        m,
        m,
        x - side2 / 2,
        y - side2 / 2,
        side2,
        side2,
      );
      return;
    }
    if (atlasReady) {
      ctx.drawImage(
        atlas,
        (i % layout.atlasColumns) * T,
        Math.floor(i / layout.atlasColumns) * T,
        T,
        T,
        x - side2 / 2,
        y - side2 / 2,
        side2,
        side2,
      );
    } else {
      // Until the atlas arrives, each tile shows its painting's average colour.
      ctx.fillStyle = layout.tiles[i].color;
      ctx.fillRect(x - side2 / 2, y - side2 / 2, side2, side2);
    }
    if (sharp && !entry && loading < 8) {
      const image = new Image();
      const record = { image, ok: false };
      sharpTiles.set(i, record);
      loading++;
      image.onload = () => {
        record.ok = true;
        loading--;
        draw();
      };
      image.onerror = () => {
        loading--;
      };
      image.src = `${data.thumbBase}/${layout.tiles[i].file}`;
    }
  };

  /** The narrow-screen photograph, with its lower right cut along the island's shore. */
  const drawHer = (inFront: boolean): void => {
    if (isWide() || !photoReady || herAlpha.a <= 0.01) return;
    const [l, t, w, h] = herBox;
    let poly: WorldPoint[] = [
      [l, t],
      [l + w, t],
      [l + w, t + h],
      [l, t + h],
    ];
    // Find the island's near shore at two heights and cut the photograph
    // along that line, so none of it shows on the far side.
    const tileHalf = (cs * cam.z) / 2;
    const shore = (y: number): number => {
      let min = Infinity;
      for (let i = 0; i < N; i++) {
        const [sx, sy] = toScreen(cells[i][0], cells[i][1]);
        if (Math.abs(sy - y) <= tileHalf && sx - tileHalf < min) min = sx - tileHalf;
      }
      return min;
    };
    const yA = t + h * 0.42;
    const yB = t + h;
    const xA = shore(yA);
    const xB = shore(yB);
    if (Number.isFinite(xA) && Number.isFinite(xB)) {
      // On the home view the cut edge tucks just under the first row of paintings.
      const tuck = inFront ? 0 : tileHalf * 2.2;
      const ax = xA + tuck;
      const dx = xB + tuck - ax;
      const dy = yB - yA;
      const sideOf = (p: WorldPoint): number => dx * (p[1] - yA) - dy * (p[0] - ax);
      const keep = sideOf([l, t]) >= 0 ? 1 : -1;
      const out: WorldPoint[] = [];
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const next = poly[(i + 1) % poly.length];
        const sp = sideOf(p) * keep;
        const sq = sideOf(next) * keep;
        if (sp >= 0) out.push(p);
        if (sp >= 0 !== sq >= 0) {
          const k = sp / (sp - sq);
          out.push([p[0] + (next[0] - p[0]) * k, p[1] + (next[1] - p[1]) * k]);
        }
      }
      if (out.length >= 3) poly = out;
    }
    // The same rounded corners as the wide-screen photograph.
    const path = new Path2D();
    poly.forEach((p, i) => {
      const prev = poly[(i + poly.length - 1) % poly.length];
      const next = poly[(i + 1) % poly.length];
      if (i === 0) path.moveTo((prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2);
      path.arcTo(p[0], p[1], (p[0] + next[0]) / 2, (p[1] + next[1]) / 2, 12);
    });
    path.closePath();
    resetTransform();
    ctx.save();
    ctx.globalAlpha = herAlpha.a;
    ctx.shadowColor = 'rgba(3, 16, 22, .7)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = '#0a2b38';
    ctx.fill(path);
    ctx.shadowColor = 'transparent';
    ctx.clip(path);
    ctx.drawImage(photo, l, t, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
  };

  function paint(): void {
    queued = false;
    if (destroyed) return;
    showHer();
    resetTransform();
    const water = ctx.createRadialGradient(
      W / 2,
      H * 0.42,
      40,
      W / 2,
      H * 0.42,
      Math.max(W, H) * 0.8,
    );
    water.addColorStop(0, '#0f3a4a');
    water.addColorStop(1, '#071f29');
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, W, H);

    // The neighbouring shore, the water's name and the logo, so the island sits in its setting.
    const fade = Math.min(1, intro.t * 1.4);
    setMapTransform();
    ctx.lineWidth = 1 / cam.z;
    ctx.strokeStyle = `rgba(253, 246, 240, ${0.2 * fade})`;
    ctx.fillStyle = `rgba(253, 246, 240, ${0.045 * fade})`;
    for (const shape of around) {
      ctx.fill(shape);
      ctx.stroke(shape);
    }
    resetTransform();
    ctx.font = `italic 400 ${Math.max(12, Math.min(22, 15 * cam.z))}px Boska, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(253, 246, 240, ${0.42 * fade})`;
    ctx.letterSpacing = '3px';
    for (const [name, x, y] of WATERS) {
      const [sx, sy] = toScreen(x, y);
      ctx.fillText(name, sx, sy);
    }
    ctx.letterSpacing = '0px';
    if (logoReady) {
      // In the same muted off-white as the water's name, twice the size on wide screens.
      const [sx, sy] = toScreen(logoAt[0], logoAt[1]);
      const lw = isWide()
        ? Math.max(168, Math.min(380, 300 * cam.z))
        : Math.max(84, Math.min(190, 150 * cam.z));
      const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
      ctx.globalAlpha = 0.42 * fade;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logo, sx - lw / 2, sy - lh / 2, lw, lh);
      ctx.globalAlpha = 1;
    }

    // She is behind the paintings on the home view, in front of the dimmed map beside the lists.
    const herFront = mode !== 'paintings';
    if (!herFront) drawHer(false);

    const tile = cs * cam.z * 0.93;
    const sharp = tile > 78;
    ctx.imageSmoothingQuality = 'high';
    let lifted: [number, number, number] | null = null;
    for (let i = 0; i < N; i++) {
      let [sx, sy] = toScreen(cells[i][0], cells[i][1]);
      const k = settle((intro.t - seed[i][2]) / 0.38);
      if (k <= 0) continue;
      if (k < 1) {
        sx += seed[i][0] * (1 - k);
        sy += seed[i][1] * (1 - k);
      }
      if (sx < -tile || sy < -tile || sx > W + tile || sy > H + tile) continue;
      if (i === hover || i === active) {
        lifted = [i, sx, sy];
        continue;
      }
      ctx.globalAlpha = k * (1 - dim.v * 0.8);
      drawTile(i, sx, sy, tile * (0.35 + 0.65 * k), sharp);
    }
    ctx.globalAlpha = 1;
    if (lifted && dim.v === 0) {
      const [i, sx, sy] = lifted;
      const size = Math.max(tile * 1.5, 54);
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - size / 2 - 2, sy - size / 2 - 2, size + 4, size + 4);
      drawTile(i, sx, sy, size, true);
    } else if (lifted) {
      ctx.globalAlpha = 1 - dim.v * 0.8;
      drawTile(lifted[0], lifted[1], lifted[2], tile, sharp);
      ctx.globalAlpha = 1;
    }

    // The coastline, in the same turned or unturned frame as the tiles.
    if (intro.t >= 1) {
      setMapTransform();
      ctx.strokeStyle = `rgba(253, 246, 240, ${0.22 + dim.v * 0.5})`;
      ctx.lineWidth = 1.2 / cam.z;
      ctx.stroke(coast);
      resetTransform();
    }
    if (herFront) drawHer(true);

    // A soft shade under the name so it reads over tiles when zoomed in.
    const shade = ctx.createLinearGradient(0, 0, 0, 92);
    shade.addColorStop(0, 'rgba(7, 31, 41, .82)');
    shade.addColorStop(1, 'rgba(7, 31, 41, 0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, 92);

    // Places: her murals, or the causes she works for.
    if (dim.v > 0.02) {
      const murals = mode === 'murals';
      ctx.font = '600 11px Switzer, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      pins().forEach((place, i) => {
        if (!place.at) return;
        const [sx, sy] = toScreen(place.at[0], place.at[1]);
        const chosen = i === pin;
        ctx.globalAlpha = dim.v;
        ctx.beginPath();
        ctx.arc(sx, sy, chosen ? 15 : 10, 0, Math.PI * 2);
        ctx.fillStyle = murals ? '#ffd166' : '#ff6f5e';
        ctx.fill();
        if (chosen) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }
        if (murals) {
          ctx.fillStyle = '#0c3340';
          ctx.fillText(String(i + 1), sx, sy + 0.5);
        }
      });
      ctx.globalAlpha = 1;
    }
  }

  // ---------- touch and mouse ----------
  const hit = (sx: number, sy: number): number => {
    const [wx, wy] = toWorld(sx, sy);
    let best = -1;
    let bestDistance = cs * 0.56;
    for (let i = 0; i < N; i++) {
      const d = Math.max(Math.abs(cells[i][0] - wx), Math.abs(cells[i][1] - wy));
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return best;
  };
  const zoomAt = (sx: number, sy: number, k: number): void => {
    const before = toWorld(sx, sy);
    cam.z *= k;
    clampCam();
    const after = toWorld(sx, sy);
    cam.x += before[0] - after[0];
    cam.y += before[1] - after[1];
    clampCam();
    draw();
  };
  const used = (): void => {
    hint.style.opacity = '0';
  };
  const tip = (i: number, x = 0, y = 0): void => {
    if (i < 0) {
      tipEl.style.opacity = '0';
      return;
    }
    tipEl.textContent = title(i);
    tipEl.style.opacity = '1';
    tipEl.style.left = `${Math.min(W - 180, x + 16)}px`;
    tipEl.style.top = `${y + 18}px`;
  };

  const ptrs = new Map<number, [number, number]>();
  let moved = 0;
  let downAt = 0;
  let pinch = 0;
  let velocity: WorldPoint = [0, 0];
  let glide: Tween | null = null;
  let lastTap = 0;

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      canvas.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      moved = 0;
      downAt = performance.now();
      fly?.kill();
      glide?.kill();
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
      }
      canvas.toggleAttribute('data-drag', true);
    },
    on,
  );
  canvas.addEventListener(
    'pointermove',
    (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) {
        if (e.pointerType === 'mouse') {
          const h = mode === 'paintings' ? hit(e.clientX, e.clientY) : -1;
          if (h !== hover) {
            hover = h;
            draw();
          }
          tip(h, e.clientX, e.clientY);
        }
        return;
      }
      const dx = e.clientX - p[0];
      const dy = e.clientY - p[1];
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      moved += Math.abs(dx) + Math.abs(dy);
      if (ptrs.size === 1) {
        const [wx, wy] = unrot(dx / cam.z, dy / cam.z);
        cam.x -= wx;
        cam.y -= wy;
        velocity = [wx, wy];
        clampCam();
        draw();
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / pinch);
        pinch = d;
      }
      if (moved > 8) used();
    },
    on,
  );
  const release = (e: PointerEvent): void => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    pinch = 0;
    canvas.toggleAttribute('data-drag', false);
    if (ptrs.size) return;
    const quick = performance.now() - downAt < 350 && moved < 8;
    if (quick) {
      const now = performance.now();
      if (now - lastTap < 320) {
        const w = toWorld(e.clientX, e.clientY);
        flyTo(w[0], w[1], Math.min(16, cam.z * 2.4), 0.7);
        lastTap = 0;
        return;
      }
      lastTap = now;
      tap(e.clientX, e.clientY);
      return;
    }
    if (!still && Math.hypot(velocity[0], velocity[1]) * cam.z > 3) {
      const v = { x: velocity[0], y: velocity[1] };
      glide = run(
        v,
        { x: 0, y: 0 },
        {
          duration: 0.9,
          ease: ease.power2Out,
          onUpdate: () => {
            cam.x -= v.x;
            cam.y -= v.y;
            clampCam();
            draw();
          },
        },
      );
    } else {
      draw();
    }
  };
  canvas.addEventListener('pointerup', release, on);
  canvas.addEventListener('pointercancel', release, on);
  canvas.addEventListener(
    'pointerleave',
    () => {
      if (hover >= 0) {
        hover = -1;
        draw();
        tip(-1);
      }
    },
    on,
  );
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      used();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016));
    },
    { passive: false, signal: abort.signal },
  );
  q<HTMLButtonElement>('zoom-in').addEventListener(
    'click',
    () => {
      flyTo(cam.x, cam.y, Math.min(16, cam.z * 1.9), 0.6);
      used();
    },
    on,
  );
  q<HTMLButtonElement>('zoom-out').addEventListener(
    'click',
    () => {
      const h = home();
      if (cam.z / 1.9 <= zHome * 1.05) flyTo(h.x, h.y, h.z, 0.8);
      else flyTo(cam.x, cam.y, cam.z / 1.9, 0.6);
    },
    on,
  );

  // ---------- tapping: a painting opens, a place is chosen ----------
  function tap(sx: number, sy: number): void {
    if (mode !== 'murals' && mode !== 'giving') {
      const i = hit(sx, sy);
      if (i >= 0) open(i);
      return;
    }
    let best = -1;
    let bestDistance = 26;
    pins().forEach((place, i) => {
      if (!place.at) return;
      const [x, y] = toScreen(place.at[0], place.at[1]);
      const d = Math.hypot(x - sx, y - sy);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    if (best >= 0) choose(best, true);
  }
  function choose(i: number, scroll = false): void {
    pin = i;
    const rows = [...q<HTMLElement>(mode).querySelectorAll('button')];
    rows.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    if (scroll) rows[i]?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    const at = pins()[i]?.at;
    if (at) {
      flyTo(at[0], at[1], Math.max(cam.z, zHome * (portrait ? 3.2 : 2.6)), 1.1);
    } else {
      const h = home();
      flyTo(h.x, h.y, h.z, 1.1);
    }
    draw();
  }
  for (const name of ['murals', 'giving']) {
    q<HTMLElement>(name).addEventListener(
      'click',
      (e) => {
        const button = (e.target as Element).closest('button');
        if (button?.dataset.i !== undefined) choose(Number(button.dataset.i));
      },
      on,
    );
  }

  // ---------- the views ----------
  let dimTween: Tween | null = null;
  for (const tab of tabs) {
    tab.addEventListener(
      'click',
      () => {
        mode = tab.dataset.tab as Mode;
        pin = -1;
        hover = -1;
        tip(-1);
        used();
        tabs.forEach((other) => other.setAttribute('aria-selected', String(other === tab)));
        panes.forEach((pane) => {
          pane.hidden = pane.dataset.pane !== mode;
        });
        root.querySelectorAll('.rows button').forEach((row) => row.removeAttribute('aria-current'));
        dimTween?.kill();
        dimTween = run(
          dim,
          { v: mode === 'murals' || mode === 'giving' ? 1 : 0 },
          { duration: still ? 0 : 0.6, onUpdate: draw },
        );
        // The panel has changed height, so reframe the island in what is left.
        requestAnimationFrame(() => {
          if (destroyed) return;
          placeHer();
          placeLogo();
          const h = home();
          if (mode === 'visit') {
            const [gx, gy] = data.gallery;
            flyTo(gx, gy, zHome * (portrait ? 3.4 : 2.8), 1.3);
            let nearest = 0;
            let nearestDistance = Infinity;
            cells.forEach((c, i) => {
              const d = Math.hypot(c[0] - gx, c[1] - gy);
              if (d < nearestDistance) {
                nearestDistance = d;
                nearest = i;
              }
            });
            active = nearest;
          } else {
            active = -1;
            flyTo(h.x, h.y, h.z, 1.1);
          }
          placeHer();
          draw();
        });
      },
      on,
    );
  }

  q<HTMLFormElement>('contact').addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      sent.hidden = false;
    },
    on,
  );

  // ---------- one painting, whole ----------
  let at = -1;
  const show = (i: number): void => {
    at = (i + N) % N;
    const painting = layout.tiles[at];
    big.src = `${data.webBase}/${painting.file}`;
    big.alt = title(at);
    cap.textContent = title(at);
    more.href = `/collection/painting/${painting.slug}`;
  };
  function open(i: number): void {
    show(i);
    active = i;
    draw();
    look.toggleAttribute('data-open', true);
    q<HTMLButtonElement>('shut').focus();
  }
  const shut = (): void => {
    look.toggleAttribute('data-open', false);
    window.setTimeout(
      () => {
        active = -1;
        draw();
      },
      still ? 0 : 300,
    );
  };
  q<HTMLButtonElement>('shut').addEventListener('click', shut, on);
  q<HTMLButtonElement>('prev').addEventListener('click', () => show(at - 1), on);
  q<HTMLButtonElement>('next').addEventListener('click', () => show(at + 1), on);
  window.addEventListener(
    'keydown',
    (e) => {
      if (!look.hasAttribute('data-open')) return;
      if (e.key === 'Escape') shut();
      if (e.key === 'ArrowRight') show(at + 1);
      if (e.key === 'ArrowLeft') show(at - 1);
    },
    on,
  );

  // ---------- opening: the paintings arrive from the west and settle into the island ----------
  window.addEventListener('resize', resize, on);
  resize();
  if (!still) {
    // The panel slides up while the tiles are settling.
    const slide = { v: 110 };
    sheet.style.transform = 'translateY(110%)';
    run(
      slide,
      { v: 0 },
      {
        duration: 1.2,
        delay: 1.5,
        ease: ease.expoOut,
        onUpdate: () => {
          sheet.style.transform = slide.v ? `translateY(${slide.v}%)` : '';
          if (cam.z <= zHome * 1.02) Object.assign(cam, home());
        },
      },
    );
    run(
      intro,
      { t: 1 },
      {
        duration: 2.6,
        onUpdate: draw,
        onComplete: () => {
          resize();
          hint.style.opacity = '0.8';
        },
      },
    );
  } else {
    hint.style.opacity = '0.8';
  }
  void document.fonts?.ready.then(() => resize());

  // A handle for end-to-end tests and for checking the layout by script.
  const debug = { cam, flyTo, home, open, toScreen, layout, zHome: (): number => zHome };
  (window as unknown as { __mosaic?: typeof debug }).__mosaic = debug;

  return () => {
    destroyed = true;
    abort.abort();
    cancelAnimationFrame(frameId);
    tweens.forEach((t) => t.kill());
    sheet.style.transform = '';
    delete (window as unknown as { __mosaic?: typeof debug }).__mosaic;
  };
}

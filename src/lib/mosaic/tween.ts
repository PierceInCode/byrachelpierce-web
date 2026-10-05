/**
 * A very small tween helper for the home-page mosaic's canvas: it animates
 * numeric fields of an object over time on requestAnimationFrame.
 *
 * It exists so the mosaic needs no animation library (dependencies are
 * frozen); it covers exactly what the canvas uses and no more.
 */

export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number): number => t,
  power2Out: (t: number): number => 1 - (1 - t) * (1 - t),
  power2InOut: (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  power3InOut: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  expoOut: (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
} satisfies Record<string, Ease>;

export interface TweenOptions {
  /** Seconds. Zero applies the end values at once. */
  duration: number;
  /** Seconds to wait before starting. */
  delay?: number;
  ease?: Ease;
  onUpdate?: () => void;
  onComplete?: () => void;
}

export interface Tween {
  kill: () => void;
}

/** Animate the numeric fields named in `to` on `target`. */
export function tween<T extends Record<string, number>>(
  target: T,
  to: Partial<T>,
  { duration, delay = 0, ease: easing = ease.linear, onUpdate, onComplete }: TweenOptions,
): Tween {
  const keys = Object.keys(to) as (keyof T)[];
  const from = {} as Record<keyof T, number>;
  let frame = 0;
  let killed = false;
  let startedAt: number | null = null;

  const finish = (): void => {
    for (const key of keys) (target[key] as number) = to[key] as number;
    onUpdate?.();
    onComplete?.();
  };

  if (duration <= 0 && delay <= 0) {
    finish();
    return { kill: () => {} };
  }

  const step = (now: number): void => {
    if (killed) return;
    if (startedAt === null) {
      startedAt = now + delay * 1000;
    }
    if (now < startedAt) {
      frame = requestAnimationFrame(step);
      return;
    }
    // Start values are read when the tween actually begins, so a delayed
    // tween picks up wherever an earlier one left the target.
    if (from[keys[0]] === undefined) for (const key of keys) from[key] = target[key];
    const t = duration <= 0 ? 1 : Math.min(1, (now - startedAt) / (duration * 1000));
    if (t >= 1) {
      finish();
      return;
    }
    const k = easing(t);
    for (const key of keys) {
      (target[key] as number) = from[key] + ((to[key] as number) - from[key]) * k;
    }
    onUpdate?.();
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);

  return {
    kill: () => {
      killed = true;
      cancelAnimationFrame(frame);
    },
  };
}

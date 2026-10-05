import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ease, tween } from '@/lib/mosaic/tween';

/**
 * The tween helper runs on requestAnimationFrame, which Node does not have,
 * so the tests supply one and step it by hand with explicit timestamps.
 */

let frames: Map<number, FrameRequestCallback>;
let nextId: number;

const step = (now: number): void => {
  const due = [...frames.values()];
  frames.clear();
  for (const callback of due) callback(now);
};

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(nextId, callback);
    return nextId++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tween', () => {
  it('moves the target to its end values over the duration', () => {
    const target = { x: 0, y: 10 };
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    tween(target, { x: 100 }, { duration: 1, onUpdate, onComplete });

    step(0);
    expect(target.x).toBe(0);
    step(500);
    expect(target.x).toBeCloseTo(50);
    expect(target.y).toBe(10);
    expect(onComplete).not.toHaveBeenCalled();
    step(1000);
    expect(target.x).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('applies the end values at once when the duration is zero', () => {
    const target = { a: 0 };
    const onComplete = vi.fn();
    tween(target, { a: 1 }, { duration: 0, onComplete });
    expect(target.a).toBe(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('waits out its delay and starts from wherever the target is by then', () => {
    const target = { v: 0 };
    tween(target, { v: 10 }, { duration: 1, delay: 1 });
    step(0);
    target.v = 4;
    step(500);
    expect(target.v).toBe(4);
    step(1500);
    expect(target.v).toBeCloseTo(7);
    step(2000);
    expect(target.v).toBe(10);
  });

  it('stops where it is when killed', () => {
    const target = { x: 0 };
    const running = tween(target, { x: 100 }, { duration: 1 });
    step(0);
    step(250);
    running.kill();
    step(1000);
    expect(target.x).toBeCloseTo(25);
    expect(frames.size).toBe(0);
  });

  it('follows the easing curve it is given', () => {
    const target = { x: 0 };
    tween(target, { x: 100 }, { duration: 1, ease: ease.power2Out });
    step(0);
    step(500);
    expect(target.x).toBeCloseTo(75);
  });
});

describe('ease', () => {
  it('starts at 0 and ends at 1 for every curve', () => {
    for (const [name, curve] of Object.entries(ease)) {
      expect(curve(0), name).toBeCloseTo(0);
      expect(curve(1), name).toBeCloseTo(1);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { displayTitle, spaceTitle } from '@/lib/mosaic/titles';

describe('spaceTitle', () => {
  it('spaces out a run-together catalogue title', () => {
    expect(spaceTitle("ABirder'sDream")).toBe("ABirder's Dream");
    expect(spaceTitle('BrightTurtles')).toBe('Bright Turtles');
  });

  it('turns underscores into spaces and separates trailing numbers', () => {
    expect(spaceTitle('A Window to the Reef_1')).toBe('A Window to the Reef 1');
    expect(spaceTitle('Reef2')).toBe('Reef 2');
  });

  it('leaves a properly spaced title alone', () => {
    expect(spaceTitle('Golden Hour Flamingos')).toBe('Golden Hour Flamingos');
  });
});

describe('displayTitle', () => {
  it('shows a real title as it is', () => {
    expect(displayTitle('Red Octopus')).toBe('Red Octopus');
  });

  it('shows "Untitled" rather than a camera or file name', () => {
    expect(displayTitle('IMG 6044 color Corrected')).toBe('Untitled');
    expect(displayTitle('dsc 0042')).toBe('Untitled');
    expect(displayTitle('2019 06 01 Single Flamingo')).toBe('Untitled');
  });

  it('keeps a title that merely starts with a short number', () => {
    expect(displayTitle('1 2 3 Jump')).toBe('1 2 3 Jump');
  });
});

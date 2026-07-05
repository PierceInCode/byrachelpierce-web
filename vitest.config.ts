import { defineConfig, defaultExclude } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // R3 Task 5 adds the first Component-layer test (Spec §4.4): tsx files
  // rendered via @testing-library/react need the automatic JSX runtime so
  // test files don't need `import React from 'react'`. tsconfig.json's
  // "jsx": "preserve" is for Next's own SWC build and doesn't apply to
  // Vitest's esbuild transform. See DECISIONS.md.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    // tests/e2e/** are Playwright specs (npm run e2e), not Vitest's.
    exclude: [...defaultExclude, 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      // R1 grew the gate to the trail surfaces it now tests end-to-end:
      // the rewritten trail-service + trail-emails and both trail API route
      // handlers (Spec §4.2 targets src/lib/** AND src/app/api/**). art-service
      // stays in scope from R0. R2 adds art-url.ts (the sole URL-assembly
      // point, Architecture §6). Still deferred (join when milestone-tested):
      // mural-data.ts (static data, real content lands R4) and the collection
      // API routes (R3's verify-then-fix + Playwright layer). DECISIONS 016,
      // 023, 024. Thresholds never lowered (Spec §4.2 / §13.2).
      include: [
        'src/lib/trail-service.ts',
        'src/lib/trail-emails.ts',
        'src/lib/art-service.ts',
        'src/lib/art-url.ts',
        'src/lib/availability.ts',
        'src/app/api/trail/checkin/route.ts',
        'src/app/api/trail/status/route.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});

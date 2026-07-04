import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      // R1 grows the gate to the trail surfaces it now tests end-to-end:
      // the rewritten trail-service + trail-emails and both trail API route
      // handlers (Spec §4.2 targets src/lib/** AND src/app/api/**). art-service
      // stays in scope from R0. Still deferred (join when milestone-tested):
      // mural-data.ts (static data, real content lands R4) and the collection
      // API routes (R3's verify-then-fix + Playwright layer). DECISIONS 016,
      // 023. Thresholds never lowered (Spec §4.2 / §13.2).
      include: [
        'src/lib/trail-service.ts',
        'src/lib/trail-emails.ts',
        'src/lib/art-service.ts',
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

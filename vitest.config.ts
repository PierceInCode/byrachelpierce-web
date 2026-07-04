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
      // R0 scopes the enforced gate to exactly what Spec §5.1.4 commissions
      // tests for — trail-service.ts and art-service.ts (Spec §4.2: "no
      // lower than 80 for the trail+art services"). Not included yet:
      // trail-emails.ts and the API routes (R1 rewrites both, Spec §6.1 —
      // testing today's pre-rewrite code is throwaway work) and
      // mural-data.ts (a static placeholder array pending real R4 content).
      // Each joins this list once it has milestone-appropriate tests.
      // DECISIONS 016, 017.
      include: ['src/lib/trail-service.ts', 'src/lib/art-service.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});

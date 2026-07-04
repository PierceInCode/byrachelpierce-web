import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['drizzle/**', 'public/**', '.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  {
    // R2 (Spec §7) migrates all artwork <img> usages to next/image via artUrl().
    // Off until then so R0 doesn't half-implement R2's work. DECISIONS.md 015.
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];

export default eslintConfig;

import {defineConfig} from 'vitest/config';
import path from 'path';

export default defineConfig({
  // tsconfig.json sets jsx: "preserve" (Next.js default); Vitest 4 uses the oxc
  // transformer, so override the JSX runtime here so .tsx sources transform in tests.
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

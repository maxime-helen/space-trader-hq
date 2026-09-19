import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// This config declares the `@` alias itself instead of extending vite.config.ts: the Vitest config
// doesn't inherit from the Vite one, and the build-only SPA fallback plugin there has no place in a
// test run.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/shared/**', 'src/modules/**/domain/**'],
      exclude: ['src/shared/api/schema.d.ts', '**/__tests__/**'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { lines: 80 },
    },
  },
});

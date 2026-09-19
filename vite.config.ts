import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// GitHub Pages does not serve the app for unknown paths
const spaFallback = (): Plugin => ({
  name: '404-fallback',
  apply: 'build',
  async writeBundle(options) {
    const dir = options.dir ?? 'dist';
    await copyFile(resolve(dir, 'index.html'), resolve(dir, '404.html'));
  },
});

export default defineConfig(() => ({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [vue(), vueDevTools(), spaFallback()],
}));

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Served from https://<user>.github.io/wix-headless-demo/
export default defineConfig({
  base: '/wix-headless-demo/',
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        callback: resolve(import.meta.dirname, 'api/auth/callback/index.html'),
      },
    },
  },
});

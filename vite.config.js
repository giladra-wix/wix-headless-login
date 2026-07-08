import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Served from https://<user>.github.io/wix-headless-login/
export default defineConfig({
  base: '/wix-headless-login/',
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

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        exsao: resolve(__dirname, 'projects/exsao.html'),
        webprofile: resolve(__dirname, 'projects/web-profile.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

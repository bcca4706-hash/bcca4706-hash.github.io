import { defineConfig } from 'vite';

// Termux + düşük RAM uyumu: tek chunk, kaynak haritası kapalı (prod).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2018',
    chunkSizeWarningLimit: 1500,
  },
  server: { host: true, port: 5173 },
});

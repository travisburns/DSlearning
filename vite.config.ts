import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // All 61 lessons ship in one bundle (~200 KB gzipped); that's fine for a local app.
  build: { chunkSizeWarningLimit: 800 },
});

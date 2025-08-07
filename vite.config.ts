import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/lone-star-legends-championship/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          game: ['pixi.js', 'matter-js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});

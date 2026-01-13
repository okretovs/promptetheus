import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for Promptetheus client
 *
 * Uses custom service worker (public/sw.js) for PWA functionality.
 * Workbox/vite-plugin-pwa was removed to prevent service worker conflicts.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend server during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

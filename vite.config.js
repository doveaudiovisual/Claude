import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/windy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/overpass': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/keeptrack': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/nominatim': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

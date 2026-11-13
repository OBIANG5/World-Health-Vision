import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Let Vite split lazy-loaded feature modules by their actual import graph.
    // Manual vendor chunks previously pulled charts, PDF and Leaflet into the
    // initial page preload, although those features are not open on startup.
    chunkSizeWarningLimit: 1200,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Proxy Frankfurter FX API — évite les erreurs CORS (api.frankfurter.dev ne renvoie pas Access-Control-Allow-Origin)
      '/fx-api': {
        target: 'https://api.frankfurter.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/fx-api/, '/v1'),
      },
    },
  },
})
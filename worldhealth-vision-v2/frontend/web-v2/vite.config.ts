import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Découpe les grosses libs en chunks séparés : le navigateur les met en cache
    // indépendamment du code applicatif et ne re-télécharge que ce qui change.
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined
          // Ordre important : 'react-leaflet' contient 'react', donc on teste leaflet d'abord.
          if (id.includes('leaflet')) return 'vendor-leaflet'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts'
          if (id.includes('jspdf')) return 'vendor-pdf'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
          return undefined
        },
      },
    },
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
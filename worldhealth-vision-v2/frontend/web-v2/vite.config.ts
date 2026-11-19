import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { searchForWorkspaceRoot } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The interactive Player imports the EXACT same CreativeEdit.tsx as the
  // server-side renderer. Both trees must use one React/Remotion runtime.
  resolve: {
    dedupe: ['react', 'react-dom', 'remotion', '@remotion/transitions', '@remotion/layout-utils'],
  },
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
    fs: {
      // Allow only the shared renderer source and the existing workspace root;
      // do not expose staging folders, media or private job files.
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        resolve(process.cwd(), '../../services/media-renderer/src'),
      ],
    },
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
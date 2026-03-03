/*
Ce fichier est responsable de:
- definir la configuration Vite du front
- activer le plugin React pour le dev server et le build
- centraliser les futurs reglages de bundling/proxy/alias
*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite du frontend (version minimale actuelle).
export default defineConfig({
  plugins: [react()],
})

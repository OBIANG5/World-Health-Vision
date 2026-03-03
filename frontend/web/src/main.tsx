/*
Ce fichier est responsable de:
- initialiser le runtime React du front
- importer les styles globaux et les styles Leaflet obligatoires
- monter le composant racine App dans #root
- activer StrictMode pour le controle des effets en developpement
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Importe le reset global et les styles de base de l application.
import './index.css'
// Composant racine de l interface.
import App from './App.tsx'
// Feuille de style Leaflet necessaire (tuiles, controles, panes).
import "leaflet/dist/leaflet.css";


// Monte l application React dans la balise #root de index.html.
createRoot(document.getElementById('root')!).render(
  // StrictMode aide a detecter les effets secondaires en dev.
  <StrictMode>
    <App />
  </StrictMode>,
)

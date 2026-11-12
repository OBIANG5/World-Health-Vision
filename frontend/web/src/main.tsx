/*
Ce fichier est responsable de:
- initialiser le runtime React du front
- importer les styles globaux et les styles Leaflet obligatoires
- monter le composant racine adapté au chemin courant
- exposer /media-studio comme Control Room isolé de la V2 principale
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MediaStudio from './media/MediaStudio.tsx'
import "leaflet/dist/leaflet.css";

const isMediaStudio =
  window.location.pathname.startsWith('/media-studio') ||
  new URLSearchParams(window.location.search).get('view') === 'media';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isMediaStudio ? <MediaStudio /> : <App />}
  </StrictMode>,
)

# Ce fichier est responsable de:
# - construire l image Docker du frontend
# - installer les dependances npm dans le conteneur
# - copier le code front dans /app/frontend/web
# - exposer le port du dev server Vite (5173)
# - lancer le front en mode developpement dans Docker
FROM node:22.12-alpine

# Repertoire de travail du frontend dans le conteneur.
WORKDIR /app/frontend/web

# Copie des manifests npm puis installation (cache Docker plus efficace).
COPY frontend/web/package*.json ./
RUN npm ci

# Copie du code source frontend.
COPY frontend/web /app/frontend/web

# Port du serveur Vite.
EXPOSE 5173

# Demarrage du frontend accessible depuis l hote.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV WHV_RENDER_PORT=8011
ENV WHV_RENDER_OUTPUT_DIR=/app/output

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ffmpeg \
      fonts-dejavu-core \
      libnss3 \
      libdbus-1-3 \
      libatk1.0-0 \
      libgbm-dev \
      libasound2 \
      libxrandr2 \
      libxkbcommon-dev \
      libxfixes3 \
      libxcomposite1 \
      libxdamage1 \
      libatk-bridge2.0-0 \
      libpango-1.0-0 \
      libcairo2 \
      libcups2 \
    && rm -rf /var/lib/apt/lists/*

COPY services/media-renderer/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund \
    && npx remotion browser ensure

COPY services/media-renderer/server.mjs ./server.mjs
COPY services/media-renderer/job-store.mjs ./job-store.mjs
COPY services/media-renderer/src ./src

RUN mkdir -p /app/output

EXPOSE 8011

CMD ["node", "server.mjs"]

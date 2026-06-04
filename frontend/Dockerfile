# Web image — builds the Vite frontend, then serves it (and reverse-proxies /api)
# with Caddy, which provisions automatic HTTPS. Build context is the repo root.
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
# Caddyfile is bind-mounted at runtime via docker-compose so it can be edited
# without rebuilding the image.

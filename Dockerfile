FROM node:20 AS base

# Builder
FROM base AS builder
WORKDIR /app

COPY package*.json ./

RUN set -ex; \
    npm ci; \
    npm cache clean --force

COPY . ./
RUN npm run build


# Production deps
FROM base AS deps-builder
WORKDIR /app

COPY package*.json ./

RUN set -ex; \
    npm pkg delete scripts.prepare || true; \
    npm ci --omit=dev; \
    npm cache clean --force


# Dist
FROM node:20-slim AS dist
WORKDIR /app

COPY --chown=node:node --from=deps-builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/docs ./docs

ARG VERSION
ENV VERSION=$VERSION

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://localhost:3000/healthcheck/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER node
CMD ["node", "dist/src/server.js"]

FROM node:20 AS base

# Builder
FROM base AS builder
WORKDIR /app

COPY package*.json .npmrc.example ./

ARG GITHUB_REGISTRY_TOKEN

RUN set -ex; \
    mv .npmrc.example .npmrc; \
    echo "" >> .npmrc; \
    echo "//npm.pkg.github.com/:_authToken=$GITHUB_REGISTRY_TOKEN" >> .npmrc; \
    npm ci; \
    npm cache clean --force; \
    rm -f .npmrc

COPY . ./
RUN npm run build


# Production deps
FROM base AS deps-builder
WORKDIR /app

COPY package*.json .npmrc.example ./

ARG GITHUB_REGISTRY_TOKEN

RUN set -ex; \
    mv .npmrc.example .npmrc; \
    echo "" >> .npmrc; \
    echo "//npm.pkg.github.com/:_authToken=$GITHUB_REGISTRY_TOKEN" >> .npmrc; \
    npm pkg delete scripts.prepare || true; \
    npm ci --omit=dev; \
    npm cache clean --force; \
    rm -f .npmrc


# Dist
FROM node:20 AS dist
WORKDIR /app

COPY --from=deps-builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docs ./docs

ARG VERSION
ENV VERSION=$VERSION

EXPOSE 3000
CMD ["node", "dist/src/server.js"]

# API Service Boilerplate

[![CI](https://github.com/iqbalr3000/api-service-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/iqbalr3000/api-service-boilerplate/actions/workflows/ci.yml)

A minimal Express 5 + TypeScript + PostgreSQL API starter with the production essentials built in: strict types, OpenAPI validation, JWT auth, health probes, graceful shutdown and CI.

The goal is a fast start for new services with a clear structure and as little speculative abstraction as possible. Add modules when real requirements appear, not before.

<br>

## Contents

-   [Stack](#stack)
-   [Requirements](#requirements)
-   [Quick Start](#quick-start)
-   [Environment](#environment)
-   [Architecture](#architecture)
-   [Scripts](#scripts)
-   [Testing](#testing)
-   [Trying the API](#trying-the-api)
-   [Deployment](#deployment)
-   [Example Module](#example-module)
-   [Notes](#notes)

<br>

## Stack

-   **Runtime:** Node.js 24, Express 5, TypeScript (strict)
-   **Database:** PostgreSQL + TypeORM (single connection, optional read replica)
-   **Auth:** stateless JWT (HS256) with a swappable verification seam
-   **API contract:** OpenAPI request validation and generated error codes
-   **Operations:** structured logging, graceful shutdown, health probes, rate-limited auth
-   **Testing:** Jest (unit + integration against a real Postgres)

<br>

## Requirements

-   Node.js >= 24, npm >= 10
-   Docker (for the local Postgres)

All dependencies are public, so no private registry or auth token is needed.

<br>

## Quick Start

**1. Install dependencies**

```bash
npm install
```

**2. Prepare the environment**

```bash
cp .env.example .env
```

**3. Start the local database**

```bash
docker-compose up -d postgres
```

**4. Run migrations**

```bash
npm run migration:run
```

**5. Start the service**

```bash
npm run start:dev
```

The API is now available at `http://localhost:3000`.

<br>

## Environment

The app validates its environment at startup and fails fast if anything required is missing.

See the full list in [`.env.example`](.env.example).

### Required

| Variable                                                  | Description                                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `NODE_ENV`                                                | `local`, `test`, `development` or `production`                                      |
| `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`  | Primary database connection                                                         |
| `JWT_SECRET`                                              | Signs and verifies JWTs (HS256). Must be at least 32 characters in production.      |

### Optional

| Variable                 | Default        | Description                                                                 |
| ------------------------ | -------------- | --------------------------------------------------------------------------- |
| `APP_ENV`                | `NODE_ENV`     | `local`, `test`, `development`, `staging` or `production`                   |
| `PORT`                   | `3000`         | HTTP port                                                                   |
| `JWT_EXPIRES_IN_SECONDS` | `3600`         | Token lifetime                                                              |
| `AUTH_RATE_LIMIT_MAX`    | `20`           | Requests per IP per 15 minutes across `/auth/register` + `/auth/login`      |
| `TRUST_PROXY_HOPS`       | `0`            | Number of proxies / load balancers in front of the app. See [Deployment](#deployment). |

### Read replica

The default is a **single connection**.

A read replica is enabled only when **all** of `PGROHOST`, `PGROPORT`, `PGROUSER` and `PGROPASSWORD` are set. Otherwise the service uses the primary connection only.

<br>

## Architecture

### Boot sequence

The boot order is load-bearing:

```
server.ts → createApp() → init() → initDB() → runInitializers() → setupController(app)
```

### Controllers

Every route uses a decorator controller: a class with `@Controller({ prefix })` and static methods decorated with `@GET`, `@POST`, `@PATCH` or `@DELETE`.

-   A controller is mounted only if it is side-effect imported in `src/controllers/index.ts`.
-   The `prefix` is the full path. App routes use `/api/v1/...`; infra routes (root, healthcheck) are unversioned.
-   Per-route middleware is attached via `preHandler` (see `controllers/me.ts`).
-   `controllers/example-item.ts` is the reference CRUD pattern.

### Services

Static classes under `src/services/<name>/`.

They acquire their TypeORM repository in a method decorated with `@Initializer()`, which runs after the database is connected.

### Errors

Throw `StandardError(ErrorCodes.X, message)`. Express 5 forwards async errors to the error middleware, so no `try/catch` is needed.

The middleware maps each `error_code` to an HTTP status:

-   Domain errors → the status from `ErrorCodeMap`
-   OpenAPI request-validation errors → `API_VALIDATION_ERROR`
-   Unknown routes → `ROUTE_NOT_FOUND`
-   Anything else → `500 SERVER_ERROR` (the request body is never logged)

> **Error codes are generated.** Don't edit `src/domain/errors.ts` by hand. Edit `docs/openapi.yaml` and `schema-http-code.json`, then run `npm run generate-error-map`.

### Validation

`express-openapi-validator` validates every request against `docs/openapi.yaml`.

> **Every route must be declared in the spec.** Undeclared paths return `404` even if a controller exists.

### Auth

Stateless JWT (HS256), verified locally on every request with no network call.

-   `POST /api/v1/auth/register` and `/login` issue tokens. Passwords are hashed with scrypt; users live in the `users` table.
-   `auth()` verifies `Authorization: Bearer <token>` and sets `req.auth`.
-   `requirePermission('resource:action')` checks the token's `permissions` claim. It must run after `auth()`.
-   `services/auth/index.ts` is the seam: swap it for JWKS/RS256 or an external auth service while keeping the contract.

Refresh tokens, password reset and email verification are intentionally left out. Add them per your needs.

<br>

## Scripts

| Script                            | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `npm run start:dev`               | Run the app in watch mode                              |
| `npm run build`                   | Compile TypeScript to `dist/`                          |
| `npm run lint` / `lint:fix`       | Run ESLint                                             |
| `npm run format` / `format:check` | Run Prettier                                           |
| `npm test`                        | Run unit tests                                         |
| `npm run test-integration`        | Run integration tests (needs the test DB up)           |
| `npm run test:all`                | Run all tests                                          |
| `npm run migration:run`           | Apply the latest migrations                            |
| `npm run migration:generate`      | Generate a migration from entity changes               |
| `npm run migration:revert`        | Roll back one migration                                |
| `npm run generate-error-map`      | Regenerate `src/domain/errors.ts` from the OpenAPI doc |

<br>

## Testing

Unit tests run without external dependencies:

```bash
npm test
```

Integration tests need the test database first:

```bash
docker-compose -f docker-compose.test.yml up -d
npm run test-integration
```

The test database runs on a separate port (`54320`), and `jest-global-setup.js` refuses to run unless `PGDATABASE=test`, so it can never wipe a real database.

CI runs lint, format check, build and the full test suite on every push and pull request.

<br>

## Trying the API

### Basic endpoints

Once the service is running:

-   `GET /`
-   `GET /healthcheck/liveness`
-   `GET /healthcheck/readiness`
-   `GET /api/v1/example-items`

### Authentication flow

```bash
# Register a user
curl -sX POST localhost:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"supersecret","name":"Me"}'

# Log in to get a token
TOKEN=$(curl -sX POST localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"supersecret"}' | jq -r .token)

# Call a protected route
curl -s localhost:3000/api/v1/me -H "Authorization: Bearer $TOKEN"
```

`GET /api/v1/me/can` also requires the `sample:read` permission. New users start with none, so grant it out-of-band (e.g. a seed or an admin flow) to try it.

<br>

## Deployment

The `Dockerfile` builds a slim Node 24 image that runs as a non-root user and ships a `HEALTHCHECK` against `/healthcheck/readiness`.

### 1. Secrets

Provide the environment variables from your platform's secret store.

Generate a strong `JWT_SECRET`, for example:

```bash
openssl rand -base64 48
```

### 2. Migrations

Run migrations as a **separate step before rolling out** the new version (a release job, an init container or a CI step). Never run them on app boot, so several instances don't race.

The production image contains no TypeScript sources, so use the compiled CLI:

```bash
docker run --rm --env-file .env.production <image> \
  node -r ./dist/src/module-alias.js ./node_modules/typeorm/cli.js \
  migration:run -d ./dist/src/libs/typeorm/ormconfig-cli.js
```

Until migrations are applied, `/healthcheck/readiness` returns `503`, so an orchestrator won't route traffic to an instance running against an old schema.

### 3. Health probes

| Probe     | Endpoint                 |
| --------- | ------------------------ |
| Liveness  | `/healthcheck/liveness`  |
| Readiness | `/healthcheck/readiness` |

On `SIGTERM` the server stops accepting connections, drains in-flight requests and closes the database pool.

### 4. Behind a load balancer

Set `TRUST_PROXY_HOPS` to the number of proxies in front of the app, so `req.ip` (used by rate limiting and logs) is the real client IP.

Leave it at `0` when the app is exposed directly. Otherwise clients can spoof `X-Forwarded-For`.

The server's keep-alive timeout assumes a proxy idle timeout of 180s (`server.ts`). Align it with your load balancer.

### 5. Rate limiting

The auth rate limiter uses an in-memory store, so each instance counts separately.

With multiple instances, plug a shared store (e.g. Redis) into `src/controllers/middlewares/rate-limit.ts`, or enforce limits at the gateway.

### Not included

Intentionally left out. Add them when you need them:

-   Metrics and tracing
-   CORS
-   Refresh tokens, password reset, email verification
-   Caching

<br>

## Example Module

A full CRUD example lives in the `example-items` module: controller, service, TypeORM entity and migration.

It is the reference for the controller/service/repository pattern and for throwing `StandardError`.

It is self-contained. To remove it:

1. Delete the `example-item` files (controller, service folder, entity, repository helper and tests).
2. Drop its import from `src/controllers/index.ts`.
3. Remove `ExampleItem` from `src/libs/typeorm/entities.ts`.
4. Remove its paths and schemas from `docs/openapi.yaml`.
5. Add a migration that drops the `example_items` table.

<br>

## Notes

This boilerplate is intentionally small. Add modules based on real needs, and avoid introducing abstractions before a concrete use case exists.

**AI coding agents:** project conventions and gotchas live in [`AGENTS.md`](AGENTS.md). For Claude Code, create a local `CLAUDE.md` containing `@AGENTS.md` (it is gitignored).

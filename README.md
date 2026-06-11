# API Service Boilerplate

A minimal, production-friendly Node.js API boilerplate. The goal is a fast start for new services with a clear structure and as little speculative abstraction as possible — add modules when real requirements appear, not before.

## Stack

-   Express + TypeScript
-   TypeORM + PostgreSQL (single connection, optional read replica)
-   Jest (unit + integration)
-   Stateless JWT auth (HS256) with a swappable verification seam
-   Structured logging, OpenAPI request validation, graceful shutdown

## Requirements

-   Node.js >= 20, npm >= 10
-   Docker (for the local Postgres)

All dependencies are public — no private registry or auth token needed.

## Quick Start

1. Install dependencies:

    ```bash
    npm install
    ```

2. Prepare environment:

    ```bash
    cp .env.example .env
    ```

3. Start the local database:

    ```bash
    docker-compose up -d postgres
    ```

4. Run migrations:

    ```bash
    npm run migration:run
    ```

5. Start the service:

    ```bash
    npm run start:dev
    ```

## Environment

Required variables (the app fails fast at startup if any are missing):

-   `NODE_ENV`, `APP_ENV`, `PORT`
-   `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`
-   `JWT_SECRET` — secret used to verify incoming JWTs (HS256)

See the full list in [`.env.example`](.env.example).

### Database mode

The default is a **single connection**. A read replica is enabled only when **all** of these are set; otherwise the service uses the primary connection only:

-   `PGROHOST`, `PGROPORT`, `PGROUSER`, `PGROPASSWORD`

## Architecture

Boot order is load-bearing: `server.ts` → `createApp()` → `init()` runs `initDB()` → `runInitializers()`, then `setupController(app)` mounts the routes.

-   **Controllers** (decorator style, used for every route): a class with `@Controller({ prefix })` and static methods decorated `@GET/@POST/@PATCH/@DELETE`. A controller is mounted only if it is side-effect imported in `src/controllers/index.ts`. The `prefix` is the full path — app/domain routes use `/api/v1/...`, infra routes (root, healthcheck) are unversioned. Per-route middleware is attached via `preHandler` (see `controllers/me.ts`). See `controllers/example-item.ts` for the CRUD pattern.
-   **Services**: static classes under `src/services/<name>/`. They acquire their TypeORM repository in a method decorated `@Initializer()`, which runs after the DB is connected.
-   **Errors**: throw `StandardError(error_code, message)` and `next(err)`. The error middleware maps `error_code` → HTTP status via `ErrorCodeMap` (and maps OpenAPI request-validation errors to `API_VALIDATION_ERROR`). That map is **generated** from `docs/openapi.yaml` — do not edit `src/domain/errors.ts` by hand; edit the OpenAPI doc and `schema-http-code.json`, then run `npm run generate-error-map`.
-   **Validation**: `express-openapi-validator` validates requests against `docs/openapi.yaml`.
-   **Auth**: stateless JWT (HS256). `POST /api/v1/auth/register` + `/login` issue tokens (passwords hashed with scrypt; users stored in the `users` table). `auth()` verifies `Authorization: Bearer <token>` locally against `JWT_SECRET` and sets `req.auth`; `requirePermission('resource:action')` checks the token's `permissions` claim (must run after `auth()`). `services/auth/index.ts` is the seam — swap it for JWKS/RS256 or an external auth service while keeping the contract. Refresh tokens, password reset, and email verification are intentionally left out — add them per your needs.

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

## Testing

Unit tests run without external dependencies. For integration tests, start the test database first:

```bash
docker-compose -f docker-compose.test.yml up -d
npm run test-integration
```

The test DB runs on a separate port (`54320`) and `jest-global-setup.js` refuses to run unless `PGDATABASE=test`, so it cannot wipe a real database.

## API Checks

After the service is running, the basic endpoints to verify:

-   `GET /`
-   `GET /healthcheck/liveness`
-   `GET /healthcheck/readiness`
-   `GET /api/v1/example-items`

### Authentication

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

`GET /api/v1/me/can` additionally requires the `sample:read` permission; new users start with none, so grant permissions out-of-band (e.g. a seed or admin flow) to exercise it.

## Example module

A full CRUD example lives in the `example-items` module (controller + service + TypeORM entity + migration). It is the canonical reference for the controller/service/repository pattern and for throwing `StandardError`. It is self-contained — to remove it, delete the `example-item.*` files, drop its import from `src/controllers/index.ts`, and empty the `entities` array in `src/libs/typeorm/entities.ts`.

## Notes

This boilerplate is intentionally small. Add modules based on real needs, and avoid introducing abstractions before a concrete use case exists.

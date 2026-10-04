# Spec: Boilerplate upgrade & cleanup

Status: agreed 2026-10-04. Built in 4 stages; each stage must leave build, lint, format and tests green.

## Stage 1 — Bug fixes

| ID | Fix |
|---|---|
| B1 | Error handler must not log `req.body` on 500s (leaks passwords). Log method + path + app env only. Drop stale redact paths (`request.data.*`); add `*.password`. |
| B2 | OpenAPI `components/parameters/id` gets `format: uuid` → non-uuid id yields 400 `API_VALIDATION_ERROR` instead of a PG cast 500. |
| B3 | `hashPassword` / `verifyPassword` become async (`crypto.scrypt` via `promisify`). Malformed stored hash returns `false` instead of throwing. |
| B4 | `HealthcheckService` no longer pins a query runner: `new MigrationExecutor(db)` creates/releases its own per call. |
| B5 | `connectionGuard` only logs pg pool `error` events (pg recreates clients itself). Applied to master and replica pools. Boot-time retry loop stays. |
| B6 | `UserService.register` catches PG unique violation (`23505`) on insert → `UNPROCESSABLE_ENTITY_ERROR` (same as the pre-check). |
| B7 | Unknown routes are already rejected by express-openapi-validator (404), but surfaced as `API_VALIDATION_ERROR`. Error handler maps validator 404 → `ROUTE_NOT_FOUND` (added to `Error404Response` enum). Docs fixed: every route MUST be in `openapi.yaml` or it 404s. |
| B9 | express-openapi-validator enforced `security: bearerAuth` itself, so a missing token returned 401 `API_VALIDATION_ERROR` instead of `USER_AUTH_ERROR`. Set `validateSecurity: false`; `auth()` is the single auth check. |
| B8 | `server.ts`: graceful shutdown destroys the DataSource (`onShutdown`); boot failure exits with code 1; `unhandledRejection` logged with `logError`. |

## Stage 2 — Cleanup

- Remove unused deps: `body-parser`, `ts-node-dev`, `tsc-watch`, `@types/ms`, `eslint-import-resolver-custom-alias`, `express-http-context`, `swagger-parser` (→ `@apidevtools/swagger-parser` devDependency), `ts-node` (TypeORM CLI + worker run through `tsx`).
- Remove dead code: `libs/logger/responseTimeLogger.ts`, `libs/util/helper.ts`, `SearchResult`/`PaginationParams`, `StandardError.lastError`.
- tsconfig: drop `allowJs`, `paths["*"]`, `dom` lib, `exclude: clients`, `jest` from build types (tests get it via `tsconfig.eslint.json`/ts-jest); target `es2022`.
- jest.config: drop stale `src/routes.ts`.
- Docker: Node 24 (`node:24` / `node:24-slim`), `engines.node >=24`; drop unused `VERSION` arg. `.dockerignore` excludes `.env*`, `.git`, `tests`. docker-compose `web`: no replica vars, no source bind mount.
- `package.json`: remove `main`.
- pino-http ignores `/healthcheck/*` for auto-logging.
- `AuthController`: drop manual checks duplicated by OpenAPI (`email` format, `password` minLength already enforced).
- `normalizeUser` reads only `sub`; `AuthUser` has no index signature.

## Stage 3 — Dependency upgrade

- Node 24 types, TypeScript 5.9 (not 7.x), Express 5 + `@types/express` 5, TypeORM 0.3.latest (1.x is a separate future decision), pino 10, pino-http 11, helmet 8, http-graceful-shutdown 4 (or latest compatible), reflect-metadata 0.2, jest 30 + ts-jest 29, supertest 7, husky 9, lint-staged latest, prettier 3 latest, dotenv, cross-env, rimraf.
- Express 5: handlers drop `try/catch + next(err)` — async rejections reach the error handler automatically. Verify `express-openapi-validator` still validates (covered by integration tests).
- ESLint 9 flat config (`eslint.config.js`): `typescript-eslint` `strictTypeChecked`, `eslint-plugin-import-x`, `eslint-plugin-jest`, `eslint-config-prettier`. airbnb removed. `no-explicit-any` ON. `.eslintignore` → `ignores` in config.
- `npm audit --omit=dev` must be clean.

## Stage 4 — Types & tests

- Error-map generator: emits `ErrorCodes` `as const`, `ErrorCode` union type, `ErrorCodeMap: Record<ErrorCode, number>`; writes straight to `src/domain/errors.ts` (no prompt). `StandardError` takes `ErrorCode`.
- `users.permissions` → native `text[]` (`array: true`), initial migration edited in place (not deployed anywhere yet).
- Tests:
  - unit: `password.ts` hash/verify round trip, wrong password, malformed hash.
  - unit: error handler (StandardError → mapped status, validator error → 400, unknown → 500 with no body logged).
  - integration: register → login → `/me`; duplicate email → 422; wrong password → 401; missing token → 401.
  - integration: example-items CRUD; non-uuid id → 400; unknown id → 404; unknown route → JSON 404.

## Stage 5 — Sharing readiness (agreed 2026-10-04)

- **CI** (`.github/workflows/ci.yml`): on push/PR — Node 24, Postgres 16 service on port 54320, `npm ci` → lint → format:check → build → `test:all`; second job builds the Docker image. README badge.
- **Auth rate limit**: `express-rate-limit` (in-memory store) as `preHandler` on `/auth/register` and `/auth/login`. `AUTH_RATE_LIMIT_MAX` per IP per 15 min (default 20). Response 429 `{ error_code: RATE_LIMIT_EXCEEDED }` (new `Error429Response` in OpenAPI + error map). `TRUST_PROXY_HOPS` (default 0) sets Express `trust proxy` so the client IP is correct behind a load balancer. Multi-instance needs a shared store or a gateway limit — documented, not built.
- **`JWT_SECRET` guard**: startup fails in `NODE_ENV=production` when the secret is shorter than 32 chars.
- **README Deployment**: env/secrets, `TRUST_PROXY_HOPS`, running migrations from the production image as a separate step before rollout (readiness stays 503 until then), rate-limit caveat, intentionally out-of-scope list.

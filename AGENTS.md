# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini CLI, …) working in this repository. Humans: see README.md.

Express 5 + TypeScript + TypeORM/PostgreSQL API boilerplate (Node >= 24). Intentionally minimal: add modules per real need, avoid speculative abstraction (see README "Notes").

## Commands

```bash
npm run start:dev            # run with tsx watch + dotenv
npm run build                # rimraf dist && tsc

npm run lint                 # eslint .ts/.js
npm run lint:fix
npm run format               # prettier write
npm run format:check

npm test                     # unit tests only (tests/unit), NODE_ENV=test
npm run test-integration     # integration tests (tests/integration), needs test DB up
npm run test:all             # everything under ./tests
npm run test-watch
```

Run a single test: `npx cross-env NODE_ENV=test jest path/to/file.test.ts` (add `-t "name"` for one case).

Integration tests need the test DB first:
```bash
docker-compose -f docker-compose.test.yml up -d
npm run test-integration
```

### Migrations / seeds (TypeORM CLI)
CLI runs through `src/libs/typeorm/ormconfig-cli.ts` (separate from the runtime `ormconfig.ts`).
```bash
npm run migration:generate   # generate from entity diffs
npm run migration:run
npm run migration:revert     # rollback one
npm run migration:show
npm run migration:seed:run   # seeds use ormconfig-seed-cli.ts
```

## Architecture

### Boot sequence
`server.ts` → loads `module-alias` first, then `createApp()` (`app.ts`) → `init()` (`init.ts`).
`init()` order is load-bearing: `initDB()` → `runInitializers()`. Initializers and any repository wiring assume the DB is already connected. `init()` also side-effect imports `src/controllers` (registering all decorator controllers); `createApp()` then calls `setupController(app)` to mount them.

### `src/*` import alias: resolved in THREE places
Keep all three in sync if you change paths:
- TypeScript: `tsconfig.json` `paths`
- Runtime: `src/module-alias.ts` (imported at the very top of `server.ts`)
- Jest: `jest.config.js` `moduleNameMapper`

### Controllers: decorator style only
All routes use decorator controllers: a class with `@Controller({ prefix })` and static methods decorated `@GET/@POST/@PATCH/@DELETE` (`src/decorators/controller.ts`). Key points:
- A controller MUST be side-effect imported in `src/controllers/index.ts` (e.g. `import 'src/controllers/example-item'`) or it won't be mounted.
- `prefix` is the FULL path. App/domain endpoints use the versioned prefix (`/api/v1/...`); infra endpoints are unversioned (`/healthcheck`, `/`). `setupController(app)` mounts each controller's router at its prefix and auto-sorts routes by specificity (static before `:params` before `*`).
- Per-route middleware goes through `preHandler` (and `postHandler`): `@GET({ path: '/can', preHandler: [auth(), requirePermission('...')] })`. See `controllers/me.ts` for the canonical example.
- Handlers are `static` and invoked as bare functions, so they must not use `this`.

### Initializers
`@Initializer()` (`src/decorators/initializer.ts`) registers a static method to run during `runInitializers()`. Used to lazily acquire TypeORM repositories after DB init, e.g. `ExampleItemService.init()` sets its repository. Services are static classes; follow the `example-item` module shape (`services/<name>/` with `<name>.ts` + `types.ts` + `index.ts`).

### Error handling: error codes are GENERATED
Throw a `StandardError(ErrorCodes.X, message, context?)` (`src/domain/standard-error.ts`) from controllers/services. Express 5 forwards rejected async handlers to the error middleware, so no `try/catch` + `next(err)` (see `example-item`). `error_code` is typed as the generated `ErrorCode` union. The error middleware (`controllers/middlewares/handle-error-code.ts`) maps `error_code` → HTTP status via `ErrorCodeMap`. `express-openapi-validator` errors (numeric `status`) keep their status: 404 → `ROUTE_NOT_FOUND`, other 4xx → `API_VALIDATION_ERROR`. Anything else becomes a 500 `SERVER_ERROR` (the request body is never logged).

**Do not edit `src/domain/errors.ts` directly**; it's generated. Edit `docs/openapi.yaml` and `src/cmd/generate-error-map/schema-http-code.json`, then run `npm run generate-error-map`.

### Request validation
`express-openapi-validator` validates requests against `docs/openapi.yaml` (`app.ts`, `validateRequests: true`). **Every route MUST be declared in the spec**: undeclared paths are rejected with 404 `ROUTE_NOT_FOUND` even if a controller exists. Security (bearer) is NOT enforced by the validator (`validateSecurity: false`). That's the `auth()` preHandler's job, so it owns the 401 shape.

### Auth (stateless JWT, HS256)
Tokens are signed at login and verified locally per request, with no network call.
- **Seam**: `services/auth/index.ts`. `authenticateToken(token)` runs `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })` → `AuthUser` (subject from `sub` only; tokens without `sub` are rejected); `signToken(subject)` issues a token; `hasPermission(user, 'x:y')` reads the `permissions` claim. Swap this file to verify/issue against a JWKS/RS256 IdP or an external auth service; keep the `{ ok, user }` / `signToken` contract and nothing else changes.
- **Issuance (local login)**: `UserService` (`services/user/`) registers users (password hashed via `libs/util/password.ts` scrypt) and verifies credentials; `AuthController` (`controllers/auth.ts`) exposes `POST /api/v1/auth/register` and `/login` (login returns a signed JWT). New users start with empty `permissions`; grant them out-of-band. Refresh tokens / password reset / email verification are intentionally NOT included (add per need).
- `auth()` (`middlewares/auth.ts`) validates `Authorization: Bearer <token>`, sets `req.auth` / `req.authToken`; any failure → 401 `USER_AUTH_ERROR`.
- `requirePermission('resource:action')` (`middlewares/permission.ts`) reads `req.auth.permissions` → 403 `REQUEST_FORBIDDEN_ERROR`. MUST run after `auth()` (use `preHandler: [auth(), requirePermission('...')]`).
- `JWT_SECRET` required at startup (>= 32 chars when `NODE_ENV=production`, else startup throws); `JWT_EXPIRES_IN_SECONDS` (default 3600) sets token lifetime (`config.ts`).
- `/auth/register` + `/auth/login` share a per-IP `rateLimit()` preHandler (`middlewares/rate-limit.ts`, in-memory store, `AUTH_RATE_LIMIT_MAX` per 15 min) → 429 `RATE_LIMIT_EXCEEDED`. Client IP depends on `TRUST_PROXY_HOPS` (Express `trust proxy`).

### Database
- Config is env-driven (`config.ts`, validated by `env-var`; required vars throw at startup).
- Single primary connection by default. Read replica activates only when ALL of `PGROHOST/PGROPORT/PGROUSER/PGROPASSWORD` are set (`DB_REPLICA` in `config.ts`) → switches `ormconfig.ts` to TypeORM `replication` mode.
- `db-connect.ts` retries connection on boot (in `NODE_ENV=test` it rethrows instead, to avoid Jest open handles). After boot it only logs pg pool `error` events, since pg replaces dead idle clients itself; do not destroy/re-init the DataSource there.
- Entities are registered in `src/libs/typeorm/entities.ts`; entity classes live in `src/domain/`.

### Logging
`pino` (`src/libs/logger/index.ts`) exposes `logger` and `logError(error, message)`. `pino-http` is the request logger in `app.ts`. Pretty-print only in local; silent in test. Sensitive fields (authorization, password, api-key, …) are redacted.

## Conventions
- Config flows through `config.ts` only: read env there, not scattered `process.env` (ESLint blocks `process.env` elsewhere).
- API responses use snake_case error bodies: `{ error_code, message }`.
- ESLint 10 flat config (`eslint.config.js`): typescript-eslint `strictTypeChecked` + import-x + jest + prettier. `no-explicit-any` is on. `tsconfig.eslint.json` (covers `src` + `tests` + root files, adds jest types) is used by ESLint AND ts-jest; the build uses `tsconfig.json` (`src` + `global.d.ts` only, so tests don't compile into `dist`).
- TypeORM CLI, worker and dev server run through `tsx` (no ts-node).
- `tsconfig` is `strict: true`. TypeORM entity columns therefore need definite-assignment assertions (`id!: string`).
- Migrations: files must match `*-db-migration{.ts,.js}` (`migrations/index.ts` glob); `migration:create`/`migration:generate` already use that prefix. Use `gen_random_uuid()` (built-in, PG13+) for uuid defaults; `installExtensions: false` means `uuid-ossp` is not available.
- CI (`.github/workflows/ci.yml`): lint → format:check → build → `test:all` against a Postgres 16 service on port 54320, plus a Docker build. Keep it green.
- Husky pre-commit runs `lint-staged` (`.husky/pre-commit`, wired via the `prepare` script). lint-staged formats + `eslint --fix`es only staged files.

## Gotchas (be aware when editing)
- **Decorator handlers are bare static functions**: no `this`. Add per-route middleware via `preHandler`/`postHandler`, not by wiring routes manually in `app.ts`.
- **`requirePermission()` depends on `auth()` running first**: it reads `req.auth`. Order the `preHandler` array accordingly.
- **`init()` import order**: `src/controllers` must be imported (it is, in `init.ts`) before `setupController(app)` runs, or no routes mount.

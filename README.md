# API Service Boilerplate

Boilerplate backend untuk service API berbasis Node.js dengan baseline yang sederhana dan production-friendly.
Node.js API service boilerplate with a simple and production-friendly baseline.

## Stack

- Express + TypeScript
- TypeORM + PostgreSQL
- Jest (unit + integration)
- External Auth Service integration (token validation + permission check)

## Project Goals | Tujuan Project

- Start cepat untuk service baru
- Struktur jelas, minim abstraction berlebihan
- Mudah di-extend saat kebutuhan nyata muncul

- Fast start for new services
- Clear structure, minimal unnecessary abstractions
- Easy to extend when real requirements appear

## Quick Start

1. Install dependency

```bash
npm install
```

2. Siapkan environment | Prepare environment

```bash
cp .env.example .env
```

3. Jalankan database lokal | Start local database

```bash
docker-compose up -d postgres
```

4. Jalankan migration | Run migrations

```bash
npm run migration:run
```

5. Jalankan service | Start service

```bash
npm run start:dev
```

## Environment

Minimal env yang wajib | Minimum required env:

- `NODE_ENV`
- `APP_ENV`
- `PORT`
- `PGDATABASE`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `AUTH_SERVICE_URL`

Lihat contoh lengkap di | See full example in [`.env.example`](/Users/iqbalramadhan/Documents/Development/Baskit/api-service-boilerplate/.env.example).

## Database Mode

Default mode adalah **single connection**.
Default mode is **single connection**.

Read replica hanya aktif jika semua variabel ini diisi.
Read replica is enabled only if all of these are set:

- `PGROHOST`
- `PGROPORT`
- `PGROUSER`
- `PGROPASSWORD`

Jika tidak diisi, service otomatis pakai koneksi primary saja.
If not set, the service automatically uses only the primary connection.

## Auth Integration

Pattern auth yang dipakai | Auth pattern used:

1. `auth()` middleware validates `Authorization: Bearer <token>` via auth service
2. `requirePermission('resource:action')` for authorization
3. Token validation results are cached in-memory (TTL 60-300 seconds)

Contoh route protected | Sample protected routes:

- `GET /api/v1/me`
- `GET /api/v1/me/can`

## Scripts

- `npm run start:dev` jalankan app mode watch | run app in watch mode
- `npm run build` compile TypeScript ke `dist/` | compile TypeScript to `dist/`
- `npm run lint` jalankan ESLint | run ESLint
- `npm run test` jalankan unit test | run unit tests
- `npm run test-integration` jalankan integration test | run integration tests
- `npm run test:all` jalankan semua test | run all tests
- `npm run migration:run` jalankan migration terbaru | run latest migrations
- `npm run migration:revert` rollback 1 migration | rollback 1 migration

## Testing

Untuk integration test, jalankan DB test dulu.
For integration tests, start the test DB first.

```bash
docker-compose -f docker-compose.test.yml up -d
npm run test-integration
```

## API Checks

Setelah service jalan, endpoint dasar yang bisa dicek.
After the service is running, basic endpoints to verify.

- `GET /`
- `GET /healthcheck/liveness`
- `GET /healthcheck/readiness`
- `GET /api/v1/example-items`

## Example CRUD (Real DB)

Contoh CRUD real tersedia di modul `example-items` (controller + service + TypeORM entity + migration).
Real CRUD example is available in the `example-items` module (controller + service + TypeORM entity + migration).

## Notes

- Boilerplate ini sengaja dibuat kecil; tambahkan module per kebutuhan nyata.
- Hindari menambah abstraction sebelum ada use case konkret.

- This boilerplate is intentionally small; add modules based on real needs.
- Avoid adding abstractions before concrete use cases exist.

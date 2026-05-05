/* eslint no-process-env: "off" */

import Env from 'env-var';

export const NODE_ENV = Env.get('NODE_ENV').required().asEnum(['local', 'test', 'development', 'production']);
export const APP_ENV = Env.get('APP_ENV').default(NODE_ENV).asEnum(['local', 'test', 'staging', 'production']);

export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_LOCAL = NODE_ENV === 'local';
export const IS_TEST = NODE_ENV === 'test';

export const SERVICE_NAME = Env.get('SERVICE_NAME').default('api-service-boilerplate').asString();
export const PORT = Env.get('PORT').default(3000).asPortNumber();

// DB
export const PGDATABASE = Env.get('PGDATABASE').required().asString();
export const PGHOST = Env.get('PGHOST').required().asString();
export const PGPORT = Env.get('PGPORT').required().asPortNumber();
export const PGUSER = Env.get('PGUSER').required().asString();
export const PGPASSWORD = Env.get('PGPASSWORD').required().asString();

export const PGROHOST = Env.get('PGROHOST').asString();
export const PGROPORT = Env.get('PGROPORT').asPortNumber();
export const PGROUSER = Env.get('PGROUSER').asString();
export const PGROPASSWORD = Env.get('PGROPASSWORD').asString();
export const HAS_DB_REPLICA = Boolean(PGROHOST && PGROPORT && PGROUSER && PGROPASSWORD);

// External auth service integration
export const AUTH_SERVICE_URL = Env.get('AUTH_SERVICE_URL').default('http://localhost:3002').asString();
export const AUTH_VALIDATE_PATH = Env.get('AUTH_VALIDATE_PATH').default('/api/v1/auth/verify-token').asString();
export const AUTH_VERIFY_PERMISSION_PATH = Env.get('AUTH_VERIFY_PERMISSION_PATH')
    .default('/api/v1/auth/verify-permission')
    .asString();
export const AUTH_FALLBACK_TIMEOUT_MS = Env.get('AUTH_FALLBACK_TIMEOUT_MS').default(3000).asIntPositive();
export const AUTH_TOKEN_CACHE_TTL_SECONDS = Env.get('AUTH_TOKEN_CACHE_TTL_SECONDS').default(120).asIntPositive();

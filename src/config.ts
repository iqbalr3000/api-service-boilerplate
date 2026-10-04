import Env from 'env-var';

export const NODE_ENV = Env.get('NODE_ENV').required().asEnum(['local', 'test', 'development', 'production']);
// Superset of NODE_ENV so the default is always valid; adds `staging` for production-like non-prod deploys.
export const APP_ENV = Env.get('APP_ENV')
    .default(NODE_ENV)
    .asEnum(['local', 'test', 'development', 'staging', 'production']);

export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_LOCAL = NODE_ENV === 'local';
export const IS_TEST = NODE_ENV === 'test';

export const SERVICE_NAME = Env.get('SERVICE_NAME').default('api-service-boilerplate').asString();
export const PORT = Env.get('PORT').default(3000).asPortNumber();
// Number of reverse proxies / load balancers in front of the app. Needed for the real client IP
// (rate limiting, logs). Keep 0 when exposed directly, or X-Forwarded-For can be spoofed.
export const TRUST_PROXY_HOPS = Env.get('TRUST_PROXY_HOPS').default(0).asIntPositive();

// DB
export const PGDATABASE = Env.get('PGDATABASE').required().asString();
export const PGHOST = Env.get('PGHOST').required().asString();
export const PGPORT = Env.get('PGPORT').required().asPortNumber();
export const PGUSER = Env.get('PGUSER').required().asString();
export const PGPASSWORD = Env.get('PGPASSWORD').required().asString();

// Read replica is enabled only when all four are set.
const PGROHOST = Env.get('PGROHOST').asString();
const PGROPORT = Env.get('PGROPORT').asPortNumber();
const PGROUSER = Env.get('PGROUSER').asString();
const PGROPASSWORD = Env.get('PGROPASSWORD').asString();
export const DB_REPLICA =
    PGROHOST && PGROPORT && PGROUSER && PGROPASSWORD
        ? { host: PGROHOST, port: PGROPORT, username: PGROUSER, password: PGROPASSWORD }
        : undefined;

// Auth: stateless JWT (HS256). The secret signs tokens at login and verifies them on each request.
export const JWT_SECRET = Env.get('JWT_SECRET').required().asString();
const MIN_PRODUCTION_SECRET_LENGTH = 32;
if (IS_PRODUCTION && JWT_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`);
}
export const JWT_EXPIRES_IN_SECONDS = Env.get('JWT_EXPIRES_IN_SECONDS').default(3600).asIntPositive();

// Requests per IP per 15 minutes, shared across /auth/register and /auth/login.
export const AUTH_RATE_LIMIT_MAX = Env.get('AUTH_RATE_LIMIT_MAX').default(20).asIntPositive();

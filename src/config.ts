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

// Auth: stateless JWT (HS256). The secret signs tokens at login and verifies them on each request.
export const JWT_SECRET = Env.get('JWT_SECRET').required().asString();
export const JWT_EXPIRES_IN_SECONDS = Env.get('JWT_EXPIRES_IN_SECONDS').default(3600).asIntPositive();

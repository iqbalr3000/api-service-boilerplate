import path from 'path';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import * as OpenApiValidator from 'express-openapi-validator';

import { TRUST_PROXY_HOPS } from 'src/config';
import { logger } from 'src/libs/logger';
import { errorHandler } from 'src/controllers/middlewares/handle-error-code';

import { init } from 'src/init';
import { DataSource } from 'typeorm';
import { getDB } from './data-source';
import { setupController } from './decorators';

export interface Application {
    app: express.Express;
    dataSource: DataSource;
}

/**
 * Main function to setup Express application here
 */
export async function createApp(): Promise<Application> {
    const app = express();
    app.set('trust proxy', TRUST_PROXY_HOPS);
    app.use(helmet());
    app.use(compression());
    app.use(express.json({ limit: '5mb', type: 'application/json' }));
    app.use(express.urlencoded({ extended: true }));

    app.use(
        pinoHttp({
            logger,
            // Skip liveness/readiness probes; they would drown out real traffic.
            autoLogging: { ignore: (req) => req.url.startsWith('/healthcheck') },
        }),
    );

    app.use(
        OpenApiValidator.middleware({
            apiSpec: path.join(process.cwd(), 'docs', 'openapi.yaml'),
            validateRequests: true,
            validateResponses: false,
            // Auth is enforced by the `auth()` preHandler, so it owns the 401 response shape.
            validateSecurity: false,
        }),
    );

    await init();

    // Mount all decorator controllers (registered via side-effect imports in src/controllers).
    // Each controller declares its full path prefix, e.g. '/api/v1/example-items' or '/healthcheck'.
    setupController(app);

    // In order for errors from async controller methods to be thrown here,
    // you need to catch the errors in the controller and use `next(err)`.
    // See https://expressjs.com/en/guide/error-handling.html
    app.use(errorHandler());

    return {
        app,
        dataSource: getDB(),
    };
}

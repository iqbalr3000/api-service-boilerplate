import express, { Router } from 'express';
import httpContext from 'express-http-context';
import compression from 'compression';
import helmet from 'helmet';
import { CompanyOpenApiValidator } from '@baskit-app/baskit-openapi-validator';

import { PORT } from 'src/config';
import { logger } from 'src/libs/logger';
import { errorHandler } from 'src/controllers/middlewares/handle-error-code';
import { auth } from 'src/controllers/middlewares/auth';
import { requirePermission } from 'src/controllers/middlewares/permission';

import { init } from 'src/init';
import { DataSource } from 'typeorm';
import { createMiddleware } from '@baskit-app/baskit-node-logger';
import { getDB } from './data-source';
import { setupController } from './decorators';

export interface Application {
    app: express.Application;
    dataSource: DataSource;
}

/**
 * Main function to setup Express application here
 */
export async function createApp(): Promise<Application> {
    const app = express();
    app.set('port', PORT);
    app.use(helmet());
    app.use(compression());
    app.use(express.json({ limit: '5mb', type: 'application/json' }));
    app.use(express.urlencoded({ extended: true }));

    app.use(createMiddleware(logger));

    new CompanyOpenApiValidator().install(app);

    // This should be last, right before routes are installed
    // so we can have access to context of all previously installed
    // middlewares inside our routes to be logged
    app.use(httpContext.middleware);

    const { rootController, errorController, healthcheckController } = await init();

    const apiRouter = Router();

    setupController(apiRouter);
    apiRouter.get('/me', auth(), (req, res) => {
        res.status(200).json({ user: req.auth });
    });
    apiRouter.get('/me/can', auth(), requirePermission('sample:read'), (_req, res) => {
        res.status(200).json({ allowed: true });
    });

    app.use('/api/v1', apiRouter);
    app.use('/healthcheck', healthcheckController.getRouter());
    app.use('/errors', errorController.getRouter());
    app.use('/', rootController.getRouter());

    // In order for errors from async controller methods to be thrown here,
    // you need to catch the errors in the controller and use `next(err)`.
    // See https://expressjs.com/en/guide/error-handling.html
    app.use(errorHandler());

    return {
        app,
        dataSource: getDB(),
    };
}

import 'reflect-metadata'; // for TypeORM
import 'src/controllers';
import { ErrorController } from 'src/controllers/error';
import { HealthcheckController } from 'src/controllers/healthcheck';
import { RootController } from 'src/controllers/root';
import { initDB } from './data-source';
import { runInitializers } from './decorators';

/**
 * Initialize all ENV values and dependencies here so that they are re-usable across web servers, queue runners and crons
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export async function init() {
    await initDB();

    await runInitializers();

    // controllers
    const rootController = new RootController();
    const errorController = new ErrorController();
    const healthcheckController = new HealthcheckController();

    return {
        rootController,
        errorController,
        healthcheckController,
    };
}

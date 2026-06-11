import 'reflect-metadata'; // for TypeORM
import 'src/controllers'; // side-effect import: registers all decorator controllers
import { initDB } from './data-source';
import { runInitializers } from './decorators';

/**
 * Initialize all ENV values and dependencies here so that they are re-usable across web servers, queue runners and crons
 */
export async function init() {
    await initDB();

    await runInitializers();
}

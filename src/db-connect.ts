import { DataSource } from 'typeorm';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
import { Pool } from 'pg';

import { sleep } from './libs/sleep';
import { logError, logger } from './libs/logger';
import { OrmConfig } from './libs/typeorm/ormconfig';
import { IS_TEST } from './config';

// pg emits `error` on the pool when an idle client dies (DB restart, network blip). The pool itself
// stays usable and replaces the client on next checkout — but an unhandled `error` event crashes the
// process, so we only need to listen and log.
function connectionGuard(dataSource: DataSource) {
    if (!(dataSource.driver instanceof PostgresDriver)) {
        return;
    }

    // TypeORM types its pg pools as `any`.
    const { master, slaves } = dataSource.driver as unknown as { master: Pool; slaves: Pool[] };
    const pools = [master, ...slaves];
    pools.forEach((pool) => {
        pool.on('error', (err: Error) => {
            logError(err, 'Idle DB client error; the pool will replace it');
        });
    });
}

// 1. Wait for db to come online and connect
// 2. Idle client errors are logged, not fatal (see connectionGuard)
// 3. We rethrow the connection error in test mode to prevent open handles issue in Jest
export async function connect(): Promise<DataSource> {
    let dataSource: DataSource | undefined;

    logger.info('Connecting to DB...');
    while (dataSource === undefined || !dataSource.isInitialized) {
        try {
            dataSource = new DataSource(OrmConfig);
            await dataSource.initialize();
        } catch (error) {
            logError(error, 'DB connection failed, retrying');

            if (IS_TEST) {
                throw error;
            }
        }

        if (dataSource === undefined || !dataSource.isInitialized) {
            // Throttle retry
            await sleep(500);
        }
    }

    logger.info('Connected to DB');
    connectionGuard(dataSource);
    return dataSource;
}

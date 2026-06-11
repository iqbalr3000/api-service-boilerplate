import { DataSource } from 'typeorm';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
import { Pool } from 'pg';

import { sleep } from './libs/sleep';
import { logError, logger } from './libs/logger';
import { OrmConfig } from './libs/typeorm/ormconfig';
import { IS_TEST } from './config';

// Handles unstable/intermitten connection lost to DB
function connectionGuard(dataSource: DataSource) {
    // Access underlying pg driver
    if (dataSource.driver instanceof PostgresDriver) {
        const pool = dataSource.driver.master as Pool;

        // Add handler on pool error event
        pool.on('error', async (err: Error) => {
            logError(err, 'Connection pool erring out, Reconnecting...');
            try {
                await dataSource.destroy();
            } catch (innerErr) {
                logError(innerErr, `Failed to close connection: ${innerErr}`);
            }
            while (!dataSource.isInitialized) {
                try {
                    await dataSource.initialize(); // eslint-disable-line
                    logger.info('Reconnected DB');
                } catch (error) {
                    logError(error, `Reconnect Error: ${error}`);
                }

                if (!dataSource.isInitialized) {
                    // Throttle retry
                    await sleep(500); // eslint-disable-line
                }
            }
        });
    }
}

// 1. Wait for db to come online and connect
// 2. On connection instability, able to reconnect
// 3. The app should never die due to connection issue
// 3.a. We rethrow the connection error in test mode to prevent open handles issue in Jest
export async function connect(): Promise<DataSource> {
    let dataSource: DataSource | undefined;

    logger.info('Connecting to DB...');
    while (dataSource === undefined || !dataSource.isInitialized) {
        try {
            dataSource = new DataSource(OrmConfig);
            // eslint-disable-next-line no-await-in-loop
            await dataSource.initialize();
        } catch (error) {
            logError(error, `createConnection Error: ${error}`);

            if (IS_TEST) {
                throw error;
            }
        }

        if (dataSource === undefined || !dataSource.isInitialized) {
            // Throttle retry
            await sleep(500); // eslint-disable-line
        }
    }

    logger.info('Connected to DB');
    connectionGuard(dataSource);
    return dataSource;
}

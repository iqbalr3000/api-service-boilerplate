import '../module-alias';

import { logError, logger } from 'src/libs/logger';
import { sleep } from 'src/libs/sleep';

const doWork = async () => {
    logger.info(`Current time is ${Date.now()}`);
    await sleep(1000);
};

(async () => {
    // Worker runner
    // eslint-disable-next-line
    while (true) {
        try {
            await doWork(); // eslint-disable-line
        } catch (err) {
            logError(err, `error in worker: ${err}`);
        } finally {
            logger.info('done');
        }
    }
})();

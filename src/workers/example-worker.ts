import '../module-alias';

import { logErrror, logger } from 'src/libs/logger';
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
            logErrror(err, `error in worker: ${err}`);
        } finally {
            logger.info('done');
        }
    }
})();

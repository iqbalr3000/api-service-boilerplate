import '../module-alias';

import { logError, logger } from 'src/libs/logger';
import { sleep } from 'src/libs/sleep';

const doWork = async () => {
    logger.info(`Current time is ${Date.now()}`);
    await sleep(1000);
};

async function run() {
    for (;;) {
        try {
            await doWork();
        } catch (err) {
            logError(err, 'error in worker');
        }
    }
}

void run();

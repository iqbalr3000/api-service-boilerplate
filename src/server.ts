import 'source-map-support/register';
import './module-alias';

import { logErrror, logger } from 'src/libs/logger';
import { createApp } from 'src/app';
import gracefulShutdown from 'http-graceful-shutdown';

const TRAEFIK_IDLE_TIMEOUT = 180; // Traefik, Trident's transport layer, has this default idle timeout in ms

/**
 * Helper function to log an exit code before exiting the process.
 */
const logAndExitProcess = (exitCode: number) => {
    logger.info(`Exiting process: {exit_code_number: ${exitCode}`);
    process.exit(exitCode);
};

/**
 * Sets up event listeners on unexpected errors and warnings. These should theoretically
 * never happen. If they do, we assume that the app is in a bad state. For errors, we
 * exit the process with code 1.
 */
const setupProcessEventListeners = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    process.on('unhandledRejection', (reason: any) => {
        logger.warn(`encountered unhandled rejection: { reason_object: ${reason} }`);
        logAndExitProcess(1);
    });

    process.on('uncaughtException', (err: Error) => {
        logErrror(err, `encountered uncaught exception: ${err}`);
        logAndExitProcess(1);
    });

    process.on('warning', (warning: Error) => {
        logger.warn(`encountered warning: {warning_object: ${warning}}`);
    });
};

/**
 * Start an Express server and installs signal handlers on the
 * process for graceful shutdown.
 */
(async () => {
    try {
        const { app } = await createApp();
        const server = app.listen(app.get('port'), () => {
            logger.info(`Started express server: {port_number: ${app.get('port')}, env_string: ${app.get('env')}}`);
        });

        /**
         * These settings are to avoid 502 HTTP errors (connection reset by peer)
         * TLDR:
         * keepAliveTimeout needs to be greater than TRAEFIK_IDLE_TIMEOUT
         * headersTimeout needs to be greater than keepAliveTimeout
         * Further reading:
         *   https://shuheikagawa.com/blog/2019/04/25/keep-alive-timeout/
         *   https://adamcrowder.net/posts/node-express-api-and-aws-alb-502/
         *   https://github.com/nodejs/node/issues/27363
         *   https://nodejs.org/docs/latest-v10.x/api/http.html#http_server_keepalivetimeout
         *   https://doc.traefik.io/traefik/routing/entrypoints/#transport
         */

        server.keepAliveTimeout = (TRAEFIK_IDLE_TIMEOUT + 1) * 1000;
        server.headersTimeout = (TRAEFIK_IDLE_TIMEOUT + 5) * 1000;

        gracefulShutdown(server);
        setupProcessEventListeners();
    } catch (err) {
        logErrror(err, `error caught in server.ts: ${err}`);
    }
})();

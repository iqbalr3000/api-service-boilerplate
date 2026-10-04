import 'source-map-support/register';
import './module-alias';

import { logError, logger } from 'src/libs/logger';
import { createApp } from 'src/app';
import { NODE_ENV, PORT } from 'src/config';
import gracefulShutdown from 'http-graceful-shutdown';

const PROXY_IDLE_TIMEOUT = 180; // Default idle timeout (seconds) of the reverse proxy / load balancer in front of this service

/**
 * Helper function to log an exit code before exiting the process.
 */
const logAndExitProcess = (exitCode: number) => {
    logger.info({ exit_code: exitCode }, 'Exiting process');
    process.exit(exitCode);
};

/**
 * Sets up event listeners on unexpected errors and warnings. These should theoretically
 * never happen. If they do, we assume that the app is in a bad state. For errors, we
 * exit the process with code 1.
 */
const setupProcessEventListeners = () => {
    process.on('unhandledRejection', (reason: unknown) => {
        logError(reason, 'encountered unhandled rejection');
        logAndExitProcess(1);
    });

    process.on('uncaughtException', (err: Error) => {
        logError(err, 'encountered uncaught exception');
        logAndExitProcess(1);
    });

    process.on('warning', (warning: Error) => {
        logger.warn(warning, 'encountered warning');
    });
};

/**
 * Start an Express server and installs signal handlers on the
 * process for graceful shutdown.
 */
async function main() {
    try {
        const { app, dataSource } = await createApp();
        const server = app.listen(PORT, () => {
            logger.info({ port: PORT, node_env: NODE_ENV }, 'Started express server');
        });

        /**
         * These settings are to avoid 502 HTTP errors (connection reset by peer)
         * TLDR:
         * keepAliveTimeout needs to be greater than the reverse proxy / load balancer idle timeout
         * headersTimeout needs to be greater than keepAliveTimeout
         * Further reading:
         *   https://shuheikagawa.com/blog/2019/04/25/keep-alive-timeout/
         *   https://adamcrowder.net/posts/node-express-api-and-aws-alb-502/
         *   https://github.com/nodejs/node/issues/27363
         *   https://nodejs.org/docs/latest-v10.x/api/http.html#http_server_keepalivetimeout
         *   https://doc.traefik.io/traefik/routing/entrypoints/#transport
         */

        server.keepAliveTimeout = (PROXY_IDLE_TIMEOUT + 1) * 1000;
        server.headersTimeout = (PROXY_IDLE_TIMEOUT + 5) * 1000;

        gracefulShutdown(server, {
            onShutdown: async () => {
                await dataSource.destroy();
            },
        });
        setupProcessEventListeners();
    } catch (err) {
        logError(err, 'failed to start server');
        logAndExitProcess(1);
    }
}

void main();

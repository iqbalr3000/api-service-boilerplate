import { createLogger } from '@baskit-app/baskit-node-logger';
import { IS_LOCAL, IS_TEST } from 'src/config';

export const logger = createLogger({
    options: {
        // Set log level based on environment
        // eslint-disable-next-line no-nested-ternary
        level: IS_TEST ? 'silent' : IS_LOCAL ? 'debug' : 'info',

        // Redact sensitive information from logs
        redact: [
            'req.headers["api-key"]',
            'request.data.userId',
            'request.data.hashCode',
            'req.body.password',
            'req.headers.authorization',
        ],
    },
    prettyPrint: IS_LOCAL,
});

export function logError(error: unknown, message: string) {
    if (error instanceof Error) {
        logger.error(error, message);
    } else {
        logger.error(new Error(String(error)), message);
    }
}

// Backward compatibility for older imports.
export const logErrror = logError;

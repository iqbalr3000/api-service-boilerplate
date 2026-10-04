import pino from 'pino';
import { IS_LOCAL, IS_TEST } from 'src/config';

// Set log level based on environment
const level = IS_TEST ? 'silent' : IS_LOCAL ? 'debug' : 'info';

export const logger = pino({
    level,

    // Redact sensitive information from logs
    redact: ['req.headers["api-key"]', 'req.headers.authorization', 'req.headers.cookie', '*.password'],

    // Pretty-print only in local dev; JSON everywhere else
    ...(IS_LOCAL ? { transport: { target: 'pino-pretty' } } : {}),
});

export function logError(error: unknown, message: string) {
    if (error instanceof Error) {
        logger.error(error, message);
    } else {
        logger.error(new Error(String(error)), message);
    }
}

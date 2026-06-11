import pino from 'pino';
import { IS_LOCAL, IS_TEST } from 'src/config';

// Set log level based on environment
const level = IS_TEST ? 'silent' : IS_LOCAL ? 'debug' : 'info'; // eslint-disable-line no-nested-ternary

export const logger = pino({
    level,

    // Redact sensitive information from logs
    redact: [
        'req.headers["api-key"]',
        'request.data.userId',
        'request.data.hashCode',
        'req.body.password',
        'req.headers.authorization',
    ],

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

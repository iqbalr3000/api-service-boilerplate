import { rateLimit as expressRateLimit } from 'express-rate-limit';
import { ErrorCodes } from 'src/domain/errors';

type RateLimitOptions = {
    windowMs: number;
    limit: number;
};

/**
 * Per-IP rate limit returning the standard `{ error_code, message }` body with 429.
 *
 * The counter store is in-memory, so each instance counts separately. With several instances,
 * plug a shared store (e.g. `rate-limit-redis`) into `store` or enforce the limit at the gateway.
 */
export function rateLimit({ windowMs, limit }: RateLimitOptions) {
    return expressRateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (_req, res) => {
            res.status(429).json({
                error_code: ErrorCodes.RATE_LIMIT_EXCEEDED,
                message: 'Too many requests, please try again later',
            });
        },
    });
}

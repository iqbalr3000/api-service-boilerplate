import { NextFunction, Request, Response } from 'express';
import { APP_ENV } from 'src/config';
import { ErrorCodes, ErrorCodeMap } from 'src/domain/errors';
import { logError, logger } from 'src/libs/logger';

export const errorHandler = () => {
    // This is an express error handler, need to the 4 variable signature
    // eslint-disable-next-line
    return (err: any, req: Request, res: Response, _next: NextFunction) => {
        // 1. Domain errors thrown as StandardError with a known error_code
        const statusCode = ErrorCodeMap[err.error_code];
        if (statusCode) {
            logger.info(
                {
                    error_code: err.error_code,
                    status_code: statusCode,
                    context: err.context,
                },
                'API error',
            );

            return res.status(statusCode).send({
                error_code: err.error_code,
                message: err.message,
            });
        }

        // 2. Request validation errors from express-openapi-validator carry a numeric `status`
        if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
            logger.info({ status_code: err.status, errors: err.errors }, 'request validation error');

            return res.status(err.status).send({
                error_code: ErrorCodes.API_VALIDATION_ERROR,
                message: err.message,
            });
        }

        // 3. Anything else is unexpected
        logError(err, 'unexpected error');

        logger.info({
            path: `${req.method} ${req.originalUrl}`,
            request_body: req.body,
            app_env: APP_ENV,
        });

        return res.status(500).send({
            error_code: ErrorCodes.SERVER_ERROR,
            message: 'Something unexpected happened, we are investigating this issue right now',
        });
    };
};

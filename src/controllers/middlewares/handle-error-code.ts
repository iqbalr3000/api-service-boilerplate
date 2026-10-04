import { NextFunction, Request, Response } from 'express';
import { APP_ENV } from 'src/config';
import { ErrorCodes, ErrorCodeMap } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';
import { logError, logger } from 'src/libs/logger';

// Shape of errors thrown by express-openapi-validator (and http-errors in general).
type HttpError = { status: number; message: string; errors?: unknown };

function isHttpError(err: unknown): err is HttpError {
    return typeof err === 'object' && err !== null && typeof (err as { status?: unknown }).status === 'number';
}

export const errorHandler = () => {
    // Express only treats a middleware as an error handler when it declares all 4 parameters.
    return (err: unknown, req: Request, res: Response, _next: NextFunction) => {
        // 1. Domain errors thrown as StandardError
        if (err instanceof StandardError) {
            const statusCode = ErrorCodeMap[err.error_code];
            logger.info({ error_code: err.error_code, status_code: statusCode, context: err.context }, 'API error');

            return res.status(statusCode).send({ error_code: err.error_code, message: err.message });
        }

        // 2. Errors from express-openapi-validator carry a numeric `status`. It rejects every path missing
        // from docs/openapi.yaml with a 404, so that is the app's "route not found".
        if (isHttpError(err) && err.status >= 400 && err.status < 500) {
            logger.info({ status_code: err.status, errors: err.errors }, 'request validation error');

            return res.status(err.status).send({
                error_code: err.status === 404 ? ErrorCodes.ROUTE_NOT_FOUND : ErrorCodes.API_VALIDATION_ERROR,
                message: err.message,
            });
        }

        // 3. Anything else is unexpected. Never log the request body here — it may hold credentials.
        logError(err, `unexpected error: ${req.method} ${req.originalUrl} (app_env: ${APP_ENV})`);

        return res.status(500).send({
            error_code: ErrorCodes.SERVER_ERROR,
            message: 'Something unexpected happened, we are investigating this issue right now',
        });
    };
};

import { NextFunction, Request, Response } from 'express';
import { APP_ENV } from 'src/config';
import { ErrorCodeMap } from 'src/domain/errors';
import { logErrror, logger } from 'src/libs/logger';

export const errorHandler = () => {
    // This is an express error handler, need to the 4 variable signature
    // eslint-disable-next-line
    return (err: any, req: Request, res: Response, _next: NextFunction) => {
        const statusCode = Number(ErrorCodeMap[err.error_code]);

        if (!Number.isNaN(statusCode)) {
            const logContext = {
                error_code: err.error_code,
                status_code: statusCode,
                context: err.context,
            };

            logger.info(logContext, 'API error');

            return res.status(statusCode).send({
                error_code: err.error_code,
                message: err.message,
            });
        }

        logErrror(err, 'unexpected error');

        const optionalArguments: Record<string, unknown> = {
            path: `${req.method} ${req.originalUrl}`,
            request_body: req.body,
            app_env: APP_ENV,
        };

        logger.info(optionalArguments);

        return res.status(500).send({
            error_code: 'SERVER_ERROR',
            message: 'Something unexpected happened, we are investigating this issue right now',
        });
    };
};

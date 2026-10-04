import { NextFunction, Request, Response } from 'express';
import { errorHandler } from 'src/controllers/middlewares/handle-error-code';
import { ErrorCodes } from 'src/domain/errors';
import { StandardError } from 'src/domain/standard-error';
import * as loggerModule from 'src/libs/logger';

describe('errorHandler', () => {
    const req = { method: 'POST', originalUrl: '/api/v1/auth/login', body: { password: 'hunter22' } } as Request;
    const next = jest.fn() as NextFunction;
    let res: Response;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it('maps a StandardError error_code to its HTTP status', () => {
        errorHandler()(new StandardError(ErrorCodes.ITEM_NOT_FOUND, 'missing'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ error_code: ErrorCodes.ITEM_NOT_FOUND, message: 'missing' });
    });

    it('maps an OpenAPI validation error to API_VALIDATION_ERROR with its status', () => {
        errorHandler()({ status: 400, message: 'bad body', errors: [] }, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ error_code: ErrorCodes.API_VALIDATION_ERROR, message: 'bad body' });
    });

    it('maps an OpenAPI 404 (path not in spec) to ROUTE_NOT_FOUND', () => {
        errorHandler()({ status: 404, message: 'not found' }, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({ error_code: ErrorCodes.ROUTE_NOT_FOUND, message: 'not found' });
    });

    it('returns a generic 500 for unexpected errors without logging the request body', () => {
        const logErrorSpy = jest.spyOn(loggerModule, 'logError');

        errorHandler()(new Error('boom'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error_code: ErrorCodes.SERVER_ERROR }));
        expect(JSON.stringify(logErrorSpy.mock.calls)).not.toContain('hunter22');
    });
});

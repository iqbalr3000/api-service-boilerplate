import { NextFunction, Request, Response } from 'express';
import { auth } from 'src/controllers/middlewares/auth';
import * as authService from 'src/services/auth';

jest.mock('src/services/auth');

describe('auth middleware', () => {
    const mockedAuthService = authService as jest.Mocked<typeof authService>;
    let req: Request;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            header: jest.fn(),
        } as unknown as Request;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as unknown as Response;
        next = jest.fn();
    });

    it('returns 401 for missing bearer token', () => {
        (req.header as jest.Mock).mockReturnValue(undefined);

        auth()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when the token is invalid', () => {
        (req.header as jest.Mock).mockReturnValue('Bearer bad-token');
        mockedAuthService.authenticateToken.mockReturnValueOnce({ ok: false, error: 'unauthorized' });

        auth()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('sets req.auth and calls next when token is valid', () => {
        (req.header as jest.Mock).mockReturnValue('Bearer token-123');
        mockedAuthService.authenticateToken.mockReturnValueOnce({
            ok: true,
            user: { userId: 'u-1', email: 'u@mail.com', permissions: [] },
        });

        auth()(req, res, next);

        expect(req.auth).toEqual({ userId: 'u-1', email: 'u@mail.com', permissions: [] });
        expect(req.authToken).toBe('token-123');
        expect(next).toHaveBeenCalled();
    });
});

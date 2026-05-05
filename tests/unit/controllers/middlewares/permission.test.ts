import { NextFunction, Request, Response } from 'express';
import { requirePermission } from 'src/controllers/middlewares/permission';
import * as authService from 'src/services/auth';

jest.mock('src/services/auth');

describe('permission middleware', () => {
    const mockedAuthService = authService as jest.Mocked<typeof authService>;
    let req: Request;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            authToken: 'token-123',
        } as unknown as Request;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as unknown as Response;
        next = jest.fn();
    });

    it('calls next when permission is allowed', async () => {
        mockedAuthService.verifyPermission.mockResolvedValueOnce({ allowed: true });

        await requirePermission('users:read')(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('returns 403 when permission is forbidden', async () => {
        mockedAuthService.verifyPermission.mockResolvedValueOnce({ allowed: false, reason: 'forbidden' });

        await requirePermission('users:read')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

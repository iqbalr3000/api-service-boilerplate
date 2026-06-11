import { NextFunction, Request, Response } from 'express';
import { requirePermission } from 'src/controllers/middlewares/permission';
import { AuthUser } from 'src/services/auth';

describe('permission middleware', () => {
    let res: Response;
    let next: NextFunction;

    const reqWith = (user?: AuthUser) => ({ auth: user }) as unknown as Request;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as unknown as Response;
        next = jest.fn();
    });

    it('returns 401 when no authenticated user is present', () => {
        requirePermission('users:read')(reqWith(undefined), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the user holds the permission', () => {
        requirePermission('users:read')(reqWith({ userId: 'u-1', permissions: ['users:read'] }), res, next);

        expect(next).toHaveBeenCalled();
    });

    it('returns 403 when the user lacks the permission', () => {
        requirePermission('users:read')(reqWith({ userId: 'u-1', permissions: ['users:write'] }), res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

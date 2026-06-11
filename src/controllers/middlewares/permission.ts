import { NextFunction, Request, Response } from 'express';
import { hasPermission } from 'src/services/auth';
import { ErrorCodes } from 'src/domain/errors';

/**
 * Authorizes a request against a required permission. Must run AFTER `auth()` (it reads
 * `req.auth`), e.g. `preHandler: [auth(), requirePermission('resource:action')]`.
 */
export function requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.auth;
        if (!user) {
            res.status(401).json({ error_code: ErrorCodes.USER_AUTH_ERROR, message: 'Unauthorized token' });
            return;
        }

        if (!hasPermission(user, permission)) {
            res.status(403).json({ error_code: ErrorCodes.REQUEST_FORBIDDEN_ERROR, message: 'Permission denied' });
            return;
        }

        next();
    };
}

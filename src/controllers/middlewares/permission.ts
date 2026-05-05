import { NextFunction, Request, Response } from 'express';
import { verifyPermission } from 'src/services/auth';

export function requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const token = req.authToken;
        if (!token) {
            res.status(401).json({ error_code: 'USER_AUTH_ERROR', message: 'Unauthorized token' });
            return;
        }

        const result = await verifyPermission(token, permission);
        if (result.allowed) {
            next();
            return;
        }

        if (result.reason === 'unauthorized') {
            res.status(401).json({ error_code: 'USER_AUTH_ERROR', message: 'Unauthorized token' });
            return;
        }

        if (result.reason === 'forbidden') {
            res.status(403).json({ error_code: 'REQUEST_FORBIDDEN_ERROR', message: 'Permission denied' });
            return;
        }

        const statusCode = Number(result.reason || '503');
        if (statusCode === 504) {
            res.status(504).json({ error_code: 'AUTH_SERVICE_TIMEOUT', message: 'Auth service timeout' });
            return;
        }

        if (statusCode === 502) {
            res.status(502).json({ error_code: 'AUTH_SERVICE_BAD_RESPONSE', message: 'Bad auth service response' });
            return;
        }

        res.status(503).json({ error_code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Auth service unavailable' });
    };
}

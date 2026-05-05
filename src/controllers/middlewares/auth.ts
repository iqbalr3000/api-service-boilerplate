import { NextFunction, Request, Response } from 'express';
import { authenticateToken } from 'src/services/auth';

function extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) {
        return null;
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return null;
    }

    return match[1].trim();
}

export function auth() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const token = extractBearerToken(req.header('authorization'));

        if (!token) {
            res.status(401).json({ error_code: 'USER_AUTH_ERROR', message: 'Missing or invalid bearer token' });
            return;
        }

        const result = await authenticateToken(token);

        if (!result.ok || !result.user) {
            const statusCode = Number(result.error || '401');
            const mappedStatus = Number.isFinite(statusCode) ? statusCode : 401;
            res.status(mappedStatus >= 500 ? mappedStatus : 401).json({
                error_code: mappedStatus >= 500 ? 'AUTH_SERVICE_UNAVAILABLE' : 'USER_AUTH_ERROR',
                message: mappedStatus >= 500 ? 'Auth service unavailable' : 'Unauthorized token',
            });
            return;
        }

        req.auth = result.user;
        req.authToken = token;
        next();
    };
}

export function serviceBasicAuth() {
    return (_req: Request, _res: Response, next: NextFunction): void => {
        // Placeholder for backward compatibility. Enable only if needed by legacy clients.
        next();
    };
}

export function fullAuth() {
    return auth();
}

import { NextFunction, Request, Response } from 'express';
import { authenticateToken } from 'src/services/auth';
import { ErrorCodes } from 'src/domain/errors';

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
    return (req: Request, res: Response, next: NextFunction): void => {
        const token = extractBearerToken(req.header('authorization'));

        if (!token) {
            res.status(401).json({
                error_code: ErrorCodes.USER_AUTH_ERROR,
                message: 'Missing or invalid bearer token',
            });
            return;
        }

        const result = authenticateToken(token);

        if (!result.ok) {
            res.status(401).json({ error_code: ErrorCodes.USER_AUTH_ERROR, message: 'Invalid or expired token' });
            return;
        }

        req.auth = result.user;
        req.authToken = token;
        next();
    };
}

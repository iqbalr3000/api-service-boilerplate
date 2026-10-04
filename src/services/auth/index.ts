import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN_SECONDS } from 'src/config';
import { AuthResult, AuthUser } from './types';

type TokenSubject = {
    id: string;
    email?: string | null;
    name?: string | null;
    permissions?: string[];
};

/**
 * Issues a stateless JWT (HS256) for an authenticated subject. Pairs with `authenticateToken`.
 * Used by the login flow; replace alongside `authenticateToken` if you change the token format.
 */
export function signToken(subject: TokenSubject): string {
    return jwt.sign(
        {
            sub: subject.id,
            email: subject.email ?? undefined,
            name: subject.name ?? undefined,
            permissions: subject.permissions ?? [],
        },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN_SECONDS },
    );
}

function toAuthUser(payload: jwt.JwtPayload): AuthUser | null {
    if (!payload.sub) {
        return null;
    }

    return {
        userId: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : [],
    };
}

/**
 * Verifies a stateless JWT (HS256) locally and maps its claims to an AuthUser.
 *
 * This is the seam to swap if your tokens come from elsewhere: e.g. verify against a JWKS
 * (RS256) for Auth0/Cognito/Keycloak, or call out to a dedicated auth service. Keep the
 * `{ ok, user }` contract and the rest of the app is unaffected.
 */
export function authenticateToken(token: string): AuthResult {
    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        if (typeof payload === 'string') {
            return { ok: false, error: 'unauthorized' };
        }

        const user = toAuthUser(payload);
        if (!user) {
            return { ok: false, error: 'unauthorized' };
        }

        return { ok: true, user };
    } catch {
        // Invalid signature, expired, malformed, etc.
        return { ok: false, error: 'unauthorized' };
    }
}

/**
 * Whether the authenticated user holds a given permission. Permissions are read from the
 * token's `permissions` claim. Adjust this if your tokens model authorization differently
 * (e.g. an OAuth `scope` string or roles).
 */
export function hasPermission(user: AuthUser, permission: string): boolean {
    return user.permissions.includes(permission);
}

export type { AuthUser };

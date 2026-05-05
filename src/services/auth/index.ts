import { getCachedUser, setCachedUser } from './token-cache';
import { validateTokenViaAuthService, verifyPermissionViaAuthService } from './auth.api-client';
import { AuthResult, AuthUser, PermissionResult } from './types';

export async function authenticateToken(token: string): Promise<AuthResult> {
    const cachedUser = getCachedUser(token);
    if (cachedUser) {
        return { ok: true, user: cachedUser };
    }

    const result = await validateTokenViaAuthService(token);
    if (result.ok && result.user) {
        setCachedUser(token, result.user);
        return result;
    }

    return result;
}

export async function verifyPermission(token: string, permission: string): Promise<PermissionResult> {
    return verifyPermissionViaAuthService(token, permission);
}

export type { AuthUser };

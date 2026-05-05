import {
    AUTH_FALLBACK_TIMEOUT_MS,
    AUTH_SERVICE_URL,
    AUTH_VALIDATE_PATH,
    AUTH_VERIFY_PERMISSION_PATH,
} from 'src/config';
import { logError } from 'src/libs/logger';
import { AuthResult, AuthUser, PermissionResult } from './types';

class AuthHttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = 'AuthHttpError';
        this.statusCode = statusCode;
    }
}

function createUrl(path: string): string {
    return `${AUTH_SERVICE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function postJson(path: string, body: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_FALLBACK_TIMEOUT_MS);

    try {
        const response = await fetch(createUrl(path), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new AuthHttpError(response.status, `Auth service error with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof AuthHttpError) {
            throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
            throw new AuthHttpError(504, 'Auth service timeout');
        }

        throw new AuthHttpError(503, 'Auth service unavailable');
    } finally {
        clearTimeout(timeout);
    }
}

function normalizeUser(payload: Record<string, unknown>): AuthUser {
    const userId = String(payload.userId ?? payload.user_id ?? payload.id ?? '');
    if (!userId) {
        throw new Error('Missing user id in auth response');
    }

    return {
        userId,
        email: payload.email ? String(payload.email) : undefined,
        name: payload.name ? String(payload.name) : undefined,
        permissions: Array.isArray(payload.permissions) ? payload.permissions.map((x) => String(x)) : undefined,
        ...payload,
    };
}

export async function validateTokenViaAuthService(token: string): Promise<AuthResult> {
    try {
        const payload = (await postJson(AUTH_VALIDATE_PATH, { token })) as Record<string, unknown>;
        const isValid = payload.valid === true || payload.ok === true;
        if (!isValid) {
            return { ok: false, error: 'unauthorized' };
        }

        const userPayload = (payload.user as Record<string, unknown>) || payload;
        return { ok: true, user: normalizeUser(userPayload) };
    } catch (error) {
        if (error instanceof AuthHttpError && error.statusCode === 401) {
            return { ok: false, error: 'unauthorized' };
        }

        logError(error, 'Failed to validate token with auth service');

        if (error instanceof AuthHttpError) {
            return { ok: false, error: `${error.statusCode}` };
        }

        return { ok: false, error: '503' };
    }
}

export async function verifyPermissionViaAuthService(token: string, permission: string): Promise<PermissionResult> {
    try {
        const payload = (await postJson(AUTH_VERIFY_PERMISSION_PATH, {
            token,
            permission,
        })) as Record<string, unknown>;

        const allowed = payload.allowed === true || payload.ok === true;
        return {
            allowed,
            reason: allowed ? undefined : 'forbidden',
        };
    } catch (error) {
        if (error instanceof AuthHttpError && error.statusCode === 401) {
            return { allowed: false, reason: 'unauthorized' };
        }

        if (error instanceof AuthHttpError && error.statusCode === 403) {
            return { allowed: false, reason: 'forbidden' };
        }

        logError(error, 'Failed to verify permission with auth service');

        if (error instanceof AuthHttpError) {
            return { allowed: false, reason: `${error.statusCode}` };
        }

        return { allowed: false, reason: '503' };
    }
}

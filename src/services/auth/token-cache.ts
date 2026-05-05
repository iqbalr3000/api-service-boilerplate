import { AUTH_TOKEN_CACHE_TTL_SECONDS } from 'src/config';
import { AuthUser } from './types';

type CacheValue = {
    user: AuthUser;
    expiresAtMs: number;
};

const cache = new Map<string, CacheValue>();

const boundedTtlSeconds = Math.max(60, Math.min(300, AUTH_TOKEN_CACHE_TTL_SECONDS));

export function getCachedUser(token: string): AuthUser | null {
    const found = cache.get(token);
    if (!found) {
        return null;
    }

    if (Date.now() > found.expiresAtMs) {
        cache.delete(token);
        return null;
    }

    return found.user;
}

export function setCachedUser(token: string, user: AuthUser): void {
    cache.set(token, {
        user,
        expiresAtMs: Date.now() + boundedTtlSeconds * 1000,
    });
}

export function clearTokenCache(): void {
    cache.clear();
}

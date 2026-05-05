export type AuthUser = {
    userId: string;
    email?: string;
    name?: string;
    permissions?: string[];
    [key: string]: unknown;
};

export type AuthResult = {
    ok: boolean;
    user?: AuthUser;
    error?: string;
};

export type PermissionResult = {
    allowed: boolean;
    reason?: string;
};

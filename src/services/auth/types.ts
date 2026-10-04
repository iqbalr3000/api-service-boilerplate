export type AuthUser = {
    userId: string;
    email?: string;
    name?: string;
    permissions: string[];
};

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

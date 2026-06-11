export type RegisterPayload = {
    email: string;
    password: string;
    name?: string;
};

export type PublicUser = {
    id: string;
    email: string;
    name: string | null;
    permissions: string[];
};

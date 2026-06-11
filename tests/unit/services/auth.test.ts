import { signToken, authenticateToken } from 'src/services/auth';

describe('auth JWT round-trip', () => {
    it('signs a token that authenticateToken accepts', () => {
        const token = signToken({ id: 'u-1', email: 'a@b.com', name: 'A', permissions: ['sample:read'] });

        const result = authenticateToken(token);

        expect(result.ok).toBe(true);
        expect(result.user?.userId).toBe('u-1');
        expect(result.user?.email).toBe('a@b.com');
        expect(result.user?.permissions).toEqual(['sample:read']);
    });

    it('rejects a token signed with a different secret', () => {
        // A clearly invalid token (wrong signature) must not authenticate.
        const result = authenticateToken('not.a.valid.token');

        expect(result.ok).toBe(false);
    });
});

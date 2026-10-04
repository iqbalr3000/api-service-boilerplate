import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'src/config';
import { signToken, authenticateToken } from 'src/services/auth';

describe('auth JWT round-trip', () => {
    it('signs a token that authenticateToken accepts', () => {
        const token = signToken({ id: 'u-1', email: 'a@b.com', name: 'A', permissions: ['sample:read'] });

        const result = authenticateToken(token);

        expect(result).toEqual({
            ok: true,
            user: { userId: 'u-1', email: 'a@b.com', name: 'A', permissions: ['sample:read'] },
        });
    });

    it('rejects a malformed token', () => {
        expect(authenticateToken('not.a.valid.token').ok).toBe(false);
    });

    it('rejects a token signed with a different secret', () => {
        const forged = jwt.sign({ sub: 'u-1' }, 'another-secret', { algorithm: 'HS256' });

        expect(authenticateToken(forged).ok).toBe(false);
    });

    it('rejects a token without a subject', () => {
        const token = jwt.sign({ email: 'a@b.com' }, JWT_SECRET, { algorithm: 'HS256' });

        expect(authenticateToken(token).ok).toBe(false);
    });

    it('rejects an expired token', () => {
        const token = jwt.sign({ sub: 'u-1', exp: Math.floor(Date.now() / 1000) - 10 }, JWT_SECRET, {
            algorithm: 'HS256',
        });

        expect(authenticateToken(token).ok).toBe(false);
    });
});

import { hashPassword, verifyPassword } from 'src/libs/util/password';

describe('password', () => {
    it('verifies the password it hashed', async () => {
        const stored = await hashPassword('supersecret');

        await expect(verifyPassword('supersecret', stored)).resolves.toBe(true);
    });

    it('rejects a wrong password', async () => {
        const stored = await hashPassword('supersecret');

        await expect(verifyPassword('wrong-password', stored)).resolves.toBe(false);
    });

    it('salts each hash', async () => {
        const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);

        expect(a).not.toBe(b);
    });

    it.each(['', 'no-separators', 'salt::hash', 'salt:abc:hash', 'salt:-1:hash'])(
        'returns false for malformed stored value %p',
        async (stored) => {
            await expect(verifyPassword('supersecret', stored)).resolves.toBe(false);
        },
    );
});

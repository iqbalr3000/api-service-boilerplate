/* eslint-disable no-process-env -- these tests drive config.ts through its env input */

describe('config', () => {
    const originalEnv = process.env;

    afterEach(() => {
        process.env = originalEnv;
    });

    // `undefined` removes the variable, e.g. to exercise a default.
    const loadConfigWith = async (env: Record<string, string | undefined>) => {
        const merged = { ...originalEnv, ...env };
        process.env = Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined));

        let config: typeof import('src/config') | undefined;
        await jest.isolateModulesAsync(async () => {
            config = await import('src/config');
        });
        return config;
    };

    it('rejects a short JWT_SECRET in production', async () => {
        await expect(loadConfigWith({ NODE_ENV: 'production', JWT_SECRET: 'too-short' })).rejects.toThrow(/JWT_SECRET/);
    });

    it('accepts a 32+ character JWT_SECRET in production', async () => {
        await expect(loadConfigWith({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) })).resolves.toBeDefined();
    });

    it('allows a short JWT_SECRET outside production', async () => {
        await expect(loadConfigWith({ NODE_ENV: 'test', JWT_SECRET: 'short' })).resolves.toBeDefined();
    });

    it.each(['local', 'test', 'development', 'production'])('defaults APP_ENV to NODE_ENV=%s', async (nodeEnv) => {
        const config = await loadConfigWith({ NODE_ENV: nodeEnv, APP_ENV: undefined, JWT_SECRET: 'x'.repeat(32) });

        expect(config?.APP_ENV).toBe(nodeEnv);
    });
});

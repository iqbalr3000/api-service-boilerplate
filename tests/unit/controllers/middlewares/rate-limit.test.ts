import express from 'express';
import supertest from 'supertest';
import { rateLimit } from 'src/controllers/middlewares/rate-limit';
import { ErrorCodes } from 'src/domain/errors';

describe('rateLimit middleware', () => {
    const app = express();
    app.get('/limited', rateLimit({ windowMs: 60_000, limit: 2 }), (_req, res) => {
        res.status(200).json({ ok: true });
    });

    it('allows requests up to the limit, then answers 429 with the standard error body', async () => {
        const agent = supertest(app);

        expect((await agent.get('/limited')).status).toBe(200);
        expect((await agent.get('/limited')).status).toBe(200);

        const limited = await agent.get('/limited');
        expect(limited.status).toBe(429);
        expect(limited.body).toEqual({
            error_code: ErrorCodes.RATE_LIMIT_EXCEEDED,
            message: expect.any(String),
        });
        expect(limited.headers).toHaveProperty('retry-after');
    });
});

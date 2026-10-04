import { Express } from 'express';
import supertest from 'supertest';
import { DataSource } from 'typeorm';

import { createApp } from 'src/app';
import { ErrorCodes } from 'src/domain/errors';
import { User } from 'src/domain/user';

describe('Auth integration tests', () => {
    let server: Express;
    let dataSource: DataSource;

    const credentials = { email: 'Me@Example.com', password: 'supersecret' };

    beforeAll(async () => {
        const application = await createApp();
        server = application.app;
        dataSource = application.dataSource;

        await dataSource.dropDatabase();
        await dataSource.runMigrations();
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it('registers a user with a normalized email and no permissions', async () => {
        const response = await supertest(server)
            .post('/api/v1/auth/register')
            .send({ ...credentials, name: 'Me' });

        expect(response.status).toBe(201);
        expect(response.body.user).toEqual({
            id: expect.any(String),
            email: 'me@example.com',
            name: 'Me',
            permissions: [],
        });
        expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('rejects a duplicate email with 422', async () => {
        const response = await supertest(server).post('/api/v1/auth/register').send(credentials);

        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(ErrorCodes.UNPROCESSABLE_ENTITY_ERROR);
    });

    it('rejects concurrent duplicate registrations with 422, not 500', async () => {
        const payload = { email: 'race@example.com', password: 'supersecret' };

        const responses = await Promise.all([
            supertest(server).post('/api/v1/auth/register').send(payload),
            supertest(server).post('/api/v1/auth/register').send(payload),
        ]);

        expect(responses.map((r) => r.status).sort()).toEqual([201, 422]);
    });

    it('rejects a too-short password with 400', async () => {
        const response = await supertest(server)
            .post('/api/v1/auth/register')
            .send({ email: 'short@example.com', password: 'short' });

        expect(response.status).toBe(400);
        expect(response.body.error_code).toBe(ErrorCodes.API_VALIDATION_ERROR);
    });

    it('rejects a wrong password with 401', async () => {
        const response = await supertest(server)
            .post('/api/v1/auth/login')
            .send({ ...credentials, password: 'wrong-password' });

        expect(response.status).toBe(401);
        expect(response.body.error_code).toBe(ErrorCodes.USER_AUTH_ERROR);
    });

    it('logs in and accesses /me with the issued token', async () => {
        const login = await supertest(server).post('/api/v1/auth/login').send(credentials);
        expect(login.status).toBe(200);

        const me = await supertest(server).get('/api/v1/me').set('Authorization', `Bearer ${login.body.token}`);

        expect(me.status).toBe(200);
        expect(me.body.user).toEqual(expect.objectContaining({ userId: login.body.user.id, email: 'me@example.com' }));
    });

    it('applies the auth rate limit to login', async () => {
        const response = await supertest(server).post('/api/v1/auth/login').send(credentials);

        expect(response.headers).toHaveProperty('ratelimit-policy');
    });

    it('rejects /me without a token with 401', async () => {
        const response = await supertest(server).get('/api/v1/me');

        expect(response.status).toBe(401);
        expect(response.body.error_code).toBe(ErrorCodes.USER_AUTH_ERROR);
    });

    it('rejects /me/can without the required permission with 403', async () => {
        const login = await supertest(server).post('/api/v1/auth/login').send(credentials);

        const response = await supertest(server)
            .get('/api/v1/me/can')
            .set('Authorization', `Bearer ${login.body.token}`);

        expect(response.status).toBe(403);
        expect(response.body.error_code).toBe(ErrorCodes.REQUEST_FORBIDDEN_ERROR);
    });

    it('allows /me/can once the permission is granted', async () => {
        await dataSource
            .getRepository(User)
            .update({ email: 'me@example.com' }, { permissions: ['sample:read', 'sample:write'] });
        const login = await supertest(server).post('/api/v1/auth/login').send(credentials);

        const response = await supertest(server)
            .get('/api/v1/me/can')
            .set('Authorization', `Bearer ${login.body.token}`);

        expect(login.body.user.permissions).toEqual(['sample:read', 'sample:write']);
        expect(response.status).toBe(200);
    });
});

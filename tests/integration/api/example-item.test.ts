import { Express } from 'express';
import supertest from 'supertest';
import { DataSource } from 'typeorm';

import { createApp } from 'src/app';
import { ErrorCodes } from 'src/domain/errors';

describe('Example items integration tests', () => {
    let server: Express;
    let dataSource: DataSource;

    const unknownId = '00000000-0000-4000-8000-000000000000';

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

    it('runs the CRUD lifecycle', async () => {
        const created = await supertest(server)
            .post('/api/v1/example-items')
            .send({ name: '  Item A  ', description: 'first' });
        expect(created.status).toBe(201);
        expect(created.body).toEqual(expect.objectContaining({ name: 'Item A', description: 'first' }));
        const { id } = created.body;

        const list = await supertest(server).get('/api/v1/example-items');
        expect(list.status).toBe(200);
        expect(list.body.data).toHaveLength(1);

        const updated = await supertest(server).patch(`/api/v1/example-items/${id}`).send({ name: 'Item B' });
        expect(updated.status).toBe(200);
        expect(updated.body).toEqual(expect.objectContaining({ id, name: 'Item B', description: 'first' }));

        const fetched = await supertest(server).get(`/api/v1/example-items/${id}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.name).toBe('Item B');

        const removed = await supertest(server).delete(`/api/v1/example-items/${id}`);
        expect(removed.status).toBe(204);

        const gone = await supertest(server).get(`/api/v1/example-items/${id}`);
        expect(gone.status).toBe(404);
    });

    it('rejects a blank name with 400', async () => {
        const response = await supertest(server).post('/api/v1/example-items').send({ name: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.error_code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('rejects a non-uuid id with 400', async () => {
        const response = await supertest(server).get('/api/v1/example-items/not-a-uuid');

        expect(response.status).toBe(400);
        expect(response.body.error_code).toBe(ErrorCodes.API_VALIDATION_ERROR);
    });

    it.each([
        ['get', `/api/v1/example-items/${unknownId}`],
        ['patch', `/api/v1/example-items/${unknownId}`],
        ['delete', `/api/v1/example-items/${unknownId}`],
    ] as const)('returns ITEM_NOT_FOUND for %s on an unknown id', async (method, path) => {
        const response = await supertest(server)[method](path).send({ name: 'x' });

        expect(response.status).toBe(404);
        expect(response.body.error_code).toBe(ErrorCodes.ITEM_NOT_FOUND);
    });

    it('returns ROUTE_NOT_FOUND for a route missing from the spec', async () => {
        const response = await supertest(server).get('/api/v1/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body.error_code).toBe(ErrorCodes.ROUTE_NOT_FOUND);
    });
});

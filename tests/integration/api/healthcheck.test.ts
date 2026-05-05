import supertest from 'supertest';
import { DataSource } from 'typeorm';

import { createApp } from 'src/app';

describe('Healthcheck Integration tests', () => {
    let server: Express.Application;
    let dataSource: DataSource;

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

    describe('/healthcheck/liveness', () => {
        it('returns 200', async () => {
            const response = await supertest(server).get('/healthcheck/liveness');
            expect(response.status).toBe(200);
        });
    });

    describe('/healthcheck/readiness', () => {
        it('returns 200', async () => {
            const response = await supertest(server).get('/healthcheck/readiness');
            expect(response.status).toBe(200);
        });

        describe('when database is not on the latest migration', () => {
            beforeAll(async () => {
                await dataSource.dropDatabase();
            });

            afterAll(async () => {
                await dataSource.runMigrations();
            });

            it('returns 503', async () => {
                const response = await supertest(server).get('/healthcheck/readiness');
                expect(response.status).toBe(503);
            });
        });
    });

    describe('/healthcheck/donotexist', () => {
        it('returns 404', async () => {
            const response = await supertest(server).get('/healthcheck/donotexist');
            expect(response.status).toBe(404);
        });
    });
});

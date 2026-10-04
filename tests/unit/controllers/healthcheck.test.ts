import { Response, Request } from 'express';
import { HealthcheckController } from 'src/controllers/healthcheck';
import { HealthcheckService } from 'src/services/healthcheck';

jest.mock('src/services/healthcheck');
const mockedHealthcheckService = HealthcheckService as jest.Mocked<typeof HealthcheckService>;

describe('HealthcheckController', () => {
    const res = { status: undefined, json: undefined } as unknown as Response;
    let req: Request;
    beforeEach(() => {
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        req = {} as Request;
    });

    describe('GET /healthcheck/liveness', () => {
        test('should return 200 OK', () => {
            HealthcheckController.getHealthcheckLiveness(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'OK' }));
        });
    });

    describe('GET /healthcheck/readiness', () => {
        test('should return 200 OK', async () => {
            mockedHealthcheckService.isDBReady.mockResolvedValueOnce(true);
            await HealthcheckController.getHealthcheckReadiness(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ status: 'OK' });
        });

        test('should return 503 Service Unavailable when DB is not ready', async () => {
            mockedHealthcheckService.isDBReady.mockResolvedValueOnce(false);
            await HealthcheckController.getHealthcheckReadiness(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({ status: 'Service Unavailable' });
        });
    });
});

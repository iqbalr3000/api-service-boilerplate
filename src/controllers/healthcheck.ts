import { Request, Response } from 'express';
import { Controller, GET } from 'src/decorators';
import { HealthcheckService } from 'src/services/healthcheck';
import pkg from '../../package.json';

@Controller({
    prefix: '/healthcheck',
})
export class HealthcheckController {
    @GET({ path: '/liveness' })
    static async getHealthcheckLiveness(_: Request, res: Response): Promise<Response> {
        return res.status(200).json({
            status: 'OK',
            version: pkg.version,
        });
    }

    @GET({ path: '/readiness' })
    static async getHealthcheckReadiness(_: Request, res: Response): Promise<Response> {
        if (!(await HealthcheckService.isDBReady())) {
            return res.status(503).json({
                status: 'Service Unavailable',
            });
        }

        return res.status(200).json({
            status: 'OK',
        });
    }
}

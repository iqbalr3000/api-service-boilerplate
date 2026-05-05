import { Request, Response, Router } from 'express';
import { HealthcheckService } from 'src/services/healthcheck';
import pkg from '../../package.json';

export class HealthcheckController {
    private router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/liveness', HealthcheckController.getHealthcheckLiveness);
        this.router.get('/readiness', HealthcheckController.getHealthcheckReadiness);
    }

    getRouter(): Router {
        return this.router;
    }

    static async getHealthcheckLiveness(_: Request, res: Response): Promise<Response> {
        return res.status(200).json({
            status: 'OK',
            version: pkg.version,
        });
    }

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

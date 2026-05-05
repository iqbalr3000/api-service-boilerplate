import { Request, Response, Router } from 'express';
import { ErrorService } from 'src/services/error-example';

export class ErrorController {
    private router: Router;

    public constructor() {
        this.router = Router();
        this.router.get('/:http_code', this.getError.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    private getError(req: Request, res: Response) {
        const { http_code: httpCode } = req.params;
        const code = parseInt(httpCode, 10);
        const [err, instructionMsg] = ErrorService.generateError(code);
        if (err) {
            throw err;
        }

        return res.status(200).json({ message: instructionMsg });
    }
}

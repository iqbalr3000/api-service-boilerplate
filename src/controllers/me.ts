import { Request, Response } from 'express';
import { Controller, GET } from 'src/decorators';
import { auth } from 'src/controllers/middlewares/auth';
import { requirePermission } from 'src/controllers/middlewares/permission';

/**
 * Example of attaching per-route middleware to decorator controllers via `preHandler`.
 */
@Controller({
    prefix: '/api/v1/me',
})
export class MeController {
    @GET({ path: '', preHandler: [auth()] })
    static me(req: Request, res: Response): Response {
        return res.status(200).json({ user: req.auth });
    }

    @GET({ path: '/can', preHandler: [auth(), requirePermission('sample:read')] })
    static can(_req: Request, res: Response): Response {
        return res.status(200).json({ allowed: true });
    }
}

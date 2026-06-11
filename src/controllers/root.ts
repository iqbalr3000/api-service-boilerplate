import { Request, Response } from 'express';
import { Controller, GET } from 'src/decorators';

@Controller({
    prefix: '/',
})
export class RootController {
    /**
     * GET /
     * Home
     */
    @GET({ path: '' })
    static index(_req: Request, res: Response): Response {
        return res.status(200).json({ message: 'You have successfully started the application!' });
    }
}

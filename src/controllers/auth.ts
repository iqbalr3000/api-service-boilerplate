import { Request, Response } from 'express';
import { Controller, POST } from 'src/decorators';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { RegisterPayload, UserService } from 'src/services/user';
import { signToken } from 'src/services/auth';
import { rateLimit } from 'src/controllers/middlewares/rate-limit';
import { AUTH_RATE_LIMIT_MAX } from 'src/config';

type LoginPayload = { email: string; password: string };

// One shared counter for both routes: slows down credential stuffing and sign-up spam per IP.
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: AUTH_RATE_LIMIT_MAX });

// Required fields, email format and password length are enforced by docs/openapi.yaml.
@Controller({
    prefix: '/api/v1/auth',
})
export class AuthController {
    @POST({ path: '/register', preHandler: [authRateLimit] })
    static async register(req: Request<unknown, unknown, RegisterPayload>, res: Response) {
        const user = await UserService.register(req.body);
        res.status(201).json({ user: UserService.toPublicUser(user) });
    }

    @POST({ path: '/login', preHandler: [authRateLimit] })
    static async login(req: Request<unknown, unknown, LoginPayload>, res: Response) {
        const { email, password } = req.body;

        const user = await UserService.verifyCredentials(email, password);
        if (!user) {
            throw new StandardError(ErrorCodes.USER_AUTH_ERROR, 'Invalid credentials');
        }

        res.status(200).json({ token: signToken(user), user: UserService.toPublicUser(user) });
    }
}

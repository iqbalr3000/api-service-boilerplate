import { NextFunction, Request, Response } from 'express';
import { Controller, POST } from 'src/decorators';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { UserService } from 'src/services/user';
import { signToken } from 'src/services/auth';

@Controller({
    prefix: '/api/v1/auth',
})
export class AuthController {
    @POST({ path: '/register' })
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
            if (!email || !password) {
                throw new StandardError(ErrorCodes.VALIDATION_ERROR, 'email and password are required');
            }

            const user = await UserService.register({ email, password, name });
            return res.status(201).json({ user: UserService.toPublicUser(user) });
        } catch (error) {
            return next(error);
        }
    }

    @POST({ path: '/login' })
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body as { email?: string; password?: string };
            if (!email || !password) {
                throw new StandardError(ErrorCodes.VALIDATION_ERROR, 'email and password are required');
            }

            const user = await UserService.verifyCredentials(email, password);
            if (!user) {
                throw new StandardError(ErrorCodes.USER_AUTH_ERROR, 'Invalid credentials');
            }

            const token = signToken(user);
            return res.status(200).json({ token, user: UserService.toPublicUser(user) });
        } catch (error) {
            return next(error);
        }
    }
}

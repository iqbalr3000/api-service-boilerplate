/* eslint-disable */
import 'jest-extended';
import { AuthUser } from 'src/services/auth';

declare global {
    namespace Express {
        interface Request {
            auth?: AuthUser;
            authToken?: string;
        }
    }
}

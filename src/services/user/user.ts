import { Initializer } from 'src/decorators';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { User } from 'src/domain/user';
import { getUserRepository, UserRepository } from 'src/libs/typeorm/user';
import { hashPassword, verifyPassword } from 'src/libs/util/password';
import { PublicUser, RegisterPayload } from './types';

export class UserService {
    private static userRepository: UserRepository;

    @Initializer()
    static init() {
        this.userRepository = getUserRepository();
    }

    static async register(payload: RegisterPayload): Promise<User> {
        const email = payload.email.trim().toLowerCase();

        const existing = await this.userRepository.findOneBy({ email });
        if (existing) {
            throw new StandardError(ErrorCodes.UNPROCESSABLE_ENTITY_ERROR, 'Email already registered');
        }

        // New users start with no permissions — grant them out-of-band per your needs.
        const user = this.userRepository.create({
            email,
            passwordHash: hashPassword(payload.password),
            name: payload.name?.trim() || null,
            permissions: [],
        });

        return this.userRepository.save(user);
    }

    static async verifyCredentials(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOneBy({ email: email.trim().toLowerCase() });
        if (!user) {
            return null;
        }

        return verifyPassword(password, user.passwordHash) ? user : null;
    }

    static toPublicUser(user: User): PublicUser {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            permissions: user.permissions ?? [],
        };
    }
}

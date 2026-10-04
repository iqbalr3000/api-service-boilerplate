import { QueryFailedError } from 'typeorm';
import { Initializer } from 'src/decorators';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { User } from 'src/domain/user';
import { getUserRepository, UserRepository } from 'src/libs/typeorm/user';
import { hashPassword, verifyPassword } from 'src/libs/util/password';
import { PublicUser, RegisterPayload } from './types';

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION;
}

function emailTakenError() {
    return new StandardError(ErrorCodes.UNPROCESSABLE_ENTITY_ERROR, 'Email already registered');
}

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
            throw emailTakenError();
        }

        // New users start with no permissions — grant them out-of-band per your needs.
        const user = this.userRepository.create({
            email,
            passwordHash: await hashPassword(payload.password),
            name: payload.name?.trim() || null,
            permissions: [],
        });

        try {
            return await this.userRepository.save(user);
        } catch (error) {
            // A concurrent registration can pass the check above and lose the race on the unique index.
            if (isUniqueViolation(error)) {
                throw emailTakenError();
            }
            throw error;
        }
    }

    static async verifyCredentials(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOneBy({ email: email.trim().toLowerCase() });
        if (!user) {
            return null;
        }

        return (await verifyPassword(password, user.passwordHash)) ? user : null;
    }

    static toPublicUser(user: User): PublicUser {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            permissions: user.permissions,
        };
    }
}

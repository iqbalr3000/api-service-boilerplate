import { getDB } from 'src/data-source';
import { User } from 'src/domain/user';

export function getUserRepository() {
    return getDB().getRepository(User);
}

export type UserRepository = ReturnType<typeof getUserRepository>;

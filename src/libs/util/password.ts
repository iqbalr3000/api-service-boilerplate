import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keyLength: number) => Promise<Buffer>;

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

// Stored format: `<salt hex>:<key length>:<hash hex>`
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const hash = await scryptAsync(password, salt, KEY_LENGTH);

    return `${salt}:${KEY_LENGTH}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, keyLengthStr, key] = stored.split(':');
    const keyLength = Number(keyLengthStr);

    if (!salt || !key || !Number.isInteger(keyLength) || keyLength <= 0) {
        return false;
    }

    const storedHash = Buffer.from(key, 'hex');
    const candidateHash = await scryptAsync(password, salt, keyLength);

    if (storedHash.length !== candidateHash.length) {
        return false;
    }

    return timingSafeEqual(storedHash, candidateHash);
}

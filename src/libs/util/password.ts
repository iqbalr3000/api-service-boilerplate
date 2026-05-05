import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

type HashOptions = {
    saltLength?: number;
    keyLength?: number;
};

export function hashPassword(password: string, options: HashOptions = {}) {
    const { saltLength = 16, keyLength = 64 } = options;

    const salt = randomBytes(saltLength).toString('hex');
    const hash = scryptSync(password, salt, keyLength).toString('hex');

    return `${salt}:${keyLength}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
    const [salt, keyLengthStr, key] = stored.split(':');

    if (!salt || !keyLengthStr || !key) {
        throw new Error('Invalid stored password format');
    }

    const keyLength = Number(keyLengthStr);

    if (!Number.isInteger(keyLength) || keyLength <= 0) {
        return false;
    }

    const hashBuffer = Uint8Array.from(Buffer.from(key, 'hex'));
    const verifyBuffer = Uint8Array.from(scryptSync(password, salt, keyLength));

    if (hashBuffer.length !== verifyBuffer.length) {
        return false;
    }

    return timingSafeEqual(hashBuffer, verifyBuffer);
}

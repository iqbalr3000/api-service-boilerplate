export function isEmpty(value: unknown): boolean {
    if (value == null) return true;

    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'function') {
        return false;
    }

    if (typeof value === 'string' && value.trim() === '') return true;

    if (Array.isArray(value) && value.length === 0) return true;

    if (value instanceof Map || value instanceof Set) return value.size === 0;

    if (typeof value === 'object' && Object.keys(value).length === 0) return true;

    return false;
}

export function isNil(value: unknown): value is undefined | null {
    return value === undefined || value === null;
}

/**
 * Generates pagination parameters for database queries.
 *
 * @param params - The pagination parameters.
 * @param [params.page] - The current page number (1-based index).
 * @param [params.limit] - The number of items per page.
 * @returns The pagination parameters:
 *   - `limit`: The number of items per page (default is 10).
 *   - `skip`: The number of items to skip for the query.
 */
export function getPaginationParams(params: { page?: number; limit?: number } = {}) {
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = params.page && params.page > 0 ? (params.page - 1) * limit : 0;
    return { limit, skip };
}

export function toTSQuery(value: string, sep = / +/g) {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return '';
    const tokens = trimmedValue
        .split(sep)
        .map((token) => token.toLowerCase().replace(/[^a-z0-9]+/g, ''))
        .filter((token) => token !== '');
    if (tokens.length === 0) return '';
    return tokens.map((token) => `${token}:*`).join('&');
}

export function isOneOf<const T extends readonly unknown[]>(tuple: T, value: unknown): value is T[number] {
    return (tuple as readonly unknown[]).includes(value);
}

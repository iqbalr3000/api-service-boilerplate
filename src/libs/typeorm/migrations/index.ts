import path from 'path';

export const migrations = [path.join(__dirname, '*-db-migration{.ts,.js}')];

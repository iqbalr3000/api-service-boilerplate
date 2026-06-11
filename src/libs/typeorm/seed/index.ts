import path from 'path';

export const seedMigrations = [path.join(__dirname, '*-db-seed{.ts,.js}')];

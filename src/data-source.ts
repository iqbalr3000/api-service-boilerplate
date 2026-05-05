import { DataSource } from 'typeorm';
import { connect } from './db-connect';

let dataSource: DataSource | null = null;

export async function initDB(): Promise<DataSource> {
    if (dataSource && dataSource.isInitialized) {
        return dataSource;
    }

    dataSource = await connect();
    return dataSource;
}

export function getDB(): DataSource {
    if (!dataSource || !dataSource.isInitialized) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return dataSource;
}

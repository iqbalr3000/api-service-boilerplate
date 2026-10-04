import { getDB } from 'src/data-source';
import { Initializer } from 'src/decorators';
import { DataSource, MigrationExecutor } from 'typeorm';

export class HealthcheckService {
    private static db: DataSource;

    private static migrationExecutor: MigrationExecutor;

    @Initializer()
    static init() {
        const db = getDB();
        this.db = db;
        // No query runner passed: the executor acquires and releases a connection per call.
        this.migrationExecutor = new MigrationExecutor(db);
    }

    static async isDBReady(): Promise<boolean> {
        if (!this.db.isInitialized) {
            return false;
        }

        const pendingMigrations = await this.migrationExecutor.getPendingMigrations();
        return pendingMigrations.length === 0;
    }
}

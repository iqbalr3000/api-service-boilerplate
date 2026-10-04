import { OrmConfig } from 'src/libs/typeorm/ormconfig';
import { DataSource } from 'typeorm';
import { seedMigrations } from './seed';

export default new DataSource({
    ...OrmConfig,
    migrations: seedMigrations,
});

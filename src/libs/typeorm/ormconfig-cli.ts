import { OrmConfig } from 'src/libs/typeorm/ormconfig';
import { DataSource } from 'typeorm';

// eslint-disable-next-line import/no-default-export
export default new DataSource(OrmConfig);

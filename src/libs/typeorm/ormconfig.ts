import { DataSourceOptions } from 'typeorm';
import { entities } from 'src/libs/typeorm/entities';
import { migrations } from 'src/libs/typeorm/migrations';

import {
    IS_PRODUCTION,
    IS_TEST,
    HAS_DB_REPLICA,

    // Envvars for default database connection
    PGHOST,
    PGPORT,
    PGUSER,
    PGPASSWORD,
    PGDATABASE,

    // Envvars for read replica database connection
    PGROHOST,
    PGROPORT,
    PGROUSER,
    PGROPASSWORD,
} from 'src/config';

const baseConfig: DataSourceOptions = {
    // synchronize: !IS_PRODUCTION, // npm run migration:generate -- <MigrationName>
    logging: !IS_PRODUCTION && !IS_TEST,
    entities,
    migrations,
    subscribers: [],

    // Will be overwritten by env vars refer .env.example
    type: 'postgres',

    // DB Extensions need ADMIN privileges to install. We disable it here since it will always fail using app credentials
    installExtensions: false,
    extra: {
        // db.getClient wait time on a full pool connection before timing out
        connectionTimeoutMillis: 10_000,

        // time before the pool releases the client and db.getClient has to reconnect
        idleTimeoutMillis: 60_000,

        // time to consider query is taking too long
        statement_timeout: 360_000, // 6 minutes

        // Increase the default pool of 10 connections for node-pg
        // https://github.com/typeorm/typeorm/blob/master/docs/connection-options.md#common-connection-options
        // https://node-postgres.com/api/pool
        // Rough guideline on what is the right max number
        // max = (max_connection / instance_count) - instance_count
        // eg 103 = (4000 / 30) - 30
        // -- max_connection = https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Managing.Performance.html
        // -- instance_count = number of connected instance inclusive of queue runners & crons for the whole cluster
        max: IS_PRODUCTION ? 50 : 10,
    },
};

export const OrmConfig: DataSourceOptions = HAS_DB_REPLICA
    ? {
          ...baseConfig,
          replication: {
              master: {
                  database: PGDATABASE,
                  host: PGHOST,
                  port: PGPORT,
                  username: PGUSER,
                  password: PGPASSWORD,
              },
              slaves: [
                  {
                      database: PGDATABASE,
                      host: PGROHOST!,
                      port: PGROPORT!,
                      username: PGROUSER!,
                      password: PGROPASSWORD!,
                  },
              ],
          },
      }
    : {
          ...baseConfig,
          database: PGDATABASE,
          host: PGHOST,
          port: PGPORT,
          username: PGUSER,
          password: PGPASSWORD,
      };

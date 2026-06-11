import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbMigration1774000000001 implements MigrationInterface {
    name = 'DbMigration1774000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "email" text NOT NULL,
                "password_hash" text NOT NULL,
                "name" text,
                "permissions" text NOT NULL DEFAULT '',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "users"');
    }
}

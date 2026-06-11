import { MigrationInterface, QueryRunner } from 'typeorm';

export class DbMigration1774000000000 implements MigrationInterface {
    name = 'DbMigration1774000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "example_items" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "name" text NOT NULL,
                "description" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_example_items_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "example_items"');
    }
}

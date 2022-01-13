import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewColumnsToDaoStats1642073707228
  implements MigrationInterface
{
  name = 'AddNewColumnsToDaoStats1642073707228';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          ADD "change" double precision`,
    );

    // add created_at, updated_at columns with null value so we don't set time for existing records
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "dao_stats"
          ADD "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats"
          ADD "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL`,
    );

    // set current timestamp as default value for new records
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );

    await queryRunner.query(
      `ALTER TABLE "dao_stats"
          ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats"
          ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );

    // migrate change column and fill it with calculated data
    await queryRunner.query(
      `UPDATE "dao_stats_history"
       SET "change"     = "data"."new_change",
           "updated_at" = now()
       FROM (
           SELECT "date",
                  "contract_id",
                  "metric",
                  "dao",
                  "total" -
                  lag("total") OVER (PARTITION BY "contract_id", "metric", "dao" ORDER BY "date") as "new_change"
           FROM "dao_stats_history"
       ) AS "data"
       WHERE "dao_stats_history"."date" = "data"."date"
         AND "dao_stats_history"."contract_id" = "data"."contract_id"
         AND "dao_stats_history"."metric" = "data"."metric"
         AND "dao_stats_history"."dao" = "data"."dao"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dao_stats"
        DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "dao_stats"
        DROP COLUMN "created_at"`);

    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          DROP COLUMN "created_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "dao_stats_history"
          DROP COLUMN "change"`,
    );
  }
}

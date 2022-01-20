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

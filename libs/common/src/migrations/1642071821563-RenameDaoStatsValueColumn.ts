import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDaoStatsValueColumn1642071821563
  implements MigrationInterface
{
  name = 'RenameDaoStatsValueColumn1642071821563';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" RENAME COLUMN "value" TO "total"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats" RENAME COLUMN "value" TO "total"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dao_stats" RENAME COLUMN "total" TO "value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" RENAME COLUMN "total" TO "value"`,
    );
  }
}

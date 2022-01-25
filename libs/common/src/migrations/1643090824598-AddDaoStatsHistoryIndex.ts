import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDaoStatsHistoryIndex1643090824598
  implements MigrationInterface
{
  name = 'AddDaoStatsHistoryIndex1643090824598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_8653acca384a2c9ba60bdf3148" ON "dao_stats_history" ("contract_id", "metric", "dao") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8653acca384a2c9ba60bdf3148"`,
    );
  }
}

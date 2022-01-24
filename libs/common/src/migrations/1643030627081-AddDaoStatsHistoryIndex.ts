import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDaoStatsHistoryIndex1643030627081
  implements MigrationInterface
{
  name = 'AddDaoStatsHistoryIndex1643030627081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_b5e86d0b56380ac055a238bc44" ON "dao_stats_history" ("contract_id", "metric") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5e86d0b56380ac055a238bc44"`,
    );
  }
}

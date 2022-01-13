import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterDaoStatsPrimaryKeyColumnOrder1642069655537
  implements MigrationInterface
{
  name = 'AlterDaoStatsPrimaryKeyColumnOrder1642069655537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dao_stats" DROP CONSTRAINT "PK_f880e10563bf060d8a064aaff52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats" ADD CONSTRAINT "PK_f76e224957149484dae6a74c314" PRIMARY KEY ("contract_id", "metric", "dao")`,
    );

    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" DROP CONSTRAINT "PK_022664e67c592811c0b9c8de1f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" ADD CONSTRAINT "PK_d573805e2c6930b9e6afb1b7b4c" PRIMARY KEY ("date", "contract_id", "metric", "dao")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dao_stats" DROP CONSTRAINT "PK_f76e224957149484dae6a74c314"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats" ADD CONSTRAINT "PK_f880e10563bf060d8a064aaff52" PRIMARY KEY ("contract_id", "dao", "metric")`,
    );

    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" DROP CONSTRAINT "PK_d573805e2c6930b9e6afb1b7b4c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" ADD CONSTRAINT "PK_022664e67c592811c0b9c8de1f4" PRIMARY KEY ("date", "contract_id", "dao", "metric")`,
    );
  }
}

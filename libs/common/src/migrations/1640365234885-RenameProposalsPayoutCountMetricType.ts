import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProposalsPayoutCountMetricType1640365234885
  implements MigrationInterface
{
  name = 'RenameProposalsPayoutCountMetricType1640365234885';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_metric_enum" RENAME VALUE 'PROPOSALS_PAYOUT_COUNT' TO 'PROPOSALS_TRANSFER_COUNT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_history_metric_enum" RENAME VALUE 'PROPOSALS_PAYOUT_COUNT' TO 'PROPOSALS_TRANSFER_COUNT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_metric_enum" RENAME VALUE 'PROPOSALS_TRANSFER_COUNT' TO 'PROPOSALS_PAYOUT_COUNT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_history_metric_enum" RENAME VALUE 'PROPOSALS_TRANSFER_COUNT' TO 'PROPOSALS_PAYOUT_COUNT'`,
    );
  }
}

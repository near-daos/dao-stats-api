import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewMetricTypes1641803479060 implements MigrationInterface {
  name = 'AddNewMetricTypes1641803479060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "daos" DROP COLUMN "description"`);
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_history_metric_enum" RENAME TO "dao_stats_history_metric_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dao_stats_history_metric_enum" AS ENUM('DAO_COUNT', 'ACCOUNT_BALANCE', 'ACTIONS_IN_COUNT', 'ACTIONS_OUT_COUNT', 'ACTIONS_FUNCTION_CALL_IN_COUNT', 'ACTIONS_FUNCTION_CALL_OUT_COUNT', 'ACTIONS_DEPOSIT_IN_COUNT', 'ACTIONS_DEPOSIT_IN_VALUE', 'ACTIONS_DEPOSIT_OUT_COUNT', 'ACTIONS_DEPOSIT_OUT_VALUE', 'GROUPS_COUNT', 'COUNCIL_SIZE', 'MEMBERS_COUNT', 'PROPOSALS_COUNT', 'PROPOSALS_TRANSFER_COUNT', 'PROPOSALS_COUNCIL_MEMBER_COUNT', 'PROPOSALS_POLICY_CHANGE_COUNT', 'PROPOSALS_IN_PROGRESS_COUNT', 'PROPOSALS_APPROVED_COUNT', 'PROPOSALS_REJECTED_COUNT', 'PROPOSALS_EXPIRED_COUNT', 'PROPOSALS_BOUNTY_COUNT', 'PROPOSALS_MEMBER_COUNT', 'BOUNTIES_COUNT', 'BOUNTIES_VALUE_LOCKED', 'FTS_COUNT', 'FTS_VALUE_LOCKED', 'NFTS_COUNT', 'NFTS_VALUE_LOCKED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" ALTER COLUMN "metric" TYPE "public"."dao_stats_history_metric_enum" USING "metric"::"text"::"public"."dao_stats_history_metric_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."dao_stats_history_metric_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_metric_enum" RENAME TO "dao_stats_metric_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dao_stats_metric_enum" AS ENUM('DAO_COUNT', 'ACCOUNT_BALANCE', 'ACTIONS_IN_COUNT', 'ACTIONS_OUT_COUNT', 'ACTIONS_FUNCTION_CALL_IN_COUNT', 'ACTIONS_FUNCTION_CALL_OUT_COUNT', 'ACTIONS_DEPOSIT_IN_COUNT', 'ACTIONS_DEPOSIT_IN_VALUE', 'ACTIONS_DEPOSIT_OUT_COUNT', 'ACTIONS_DEPOSIT_OUT_VALUE', 'GROUPS_COUNT', 'COUNCIL_SIZE', 'MEMBERS_COUNT', 'PROPOSALS_COUNT', 'PROPOSALS_TRANSFER_COUNT', 'PROPOSALS_COUNCIL_MEMBER_COUNT', 'PROPOSALS_POLICY_CHANGE_COUNT', 'PROPOSALS_IN_PROGRESS_COUNT', 'PROPOSALS_APPROVED_COUNT', 'PROPOSALS_REJECTED_COUNT', 'PROPOSALS_EXPIRED_COUNT', 'PROPOSALS_BOUNTY_COUNT', 'PROPOSALS_MEMBER_COUNT', 'BOUNTIES_COUNT', 'BOUNTIES_VALUE_LOCKED', 'FTS_COUNT', 'FTS_VALUE_LOCKED', 'NFTS_COUNT', 'NFTS_VALUE_LOCKED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats" ALTER COLUMN "metric" TYPE "public"."dao_stats_metric_enum" USING "metric"::"text"::"public"."dao_stats_metric_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."dao_stats_metric_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."dao_stats_metric_enum_old" AS ENUM('DAO_COUNT', 'ACTIONS_IN_COUNT', 'ACTIONS_OUT_COUNT', 'ACTIONS_FUNCTION_CALL_IN_COUNT', 'ACTIONS_FUNCTION_CALL_OUT_COUNT', 'ACTIONS_DEPOSIT_IN_COUNT', 'ACTIONS_DEPOSIT_IN_VALUE', 'ACTIONS_DEPOSIT_OUT_COUNT', 'ACTIONS_DEPOSIT_OUT_VALUE', 'GROUPS_COUNT', 'COUNCIL_SIZE', 'MEMBERS_COUNT', 'PROPOSALS_COUNT', 'PROPOSALS_TRANSFER_COUNT', 'PROPOSALS_COUNCIL_MEMBER_COUNT', 'PROPOSALS_POLICY_CHANGE_COUNT', 'PROPOSALS_IN_PROGRESS_COUNT', 'PROPOSALS_APPROVED_COUNT', 'PROPOSALS_REJECTED_COUNT', 'PROPOSALS_EXPIRED_COUNT', 'PROPOSALS_BOUNTY_COUNT', 'PROPOSALS_MEMBER_COUNT', 'BOUNTIES_COUNT', 'BOUNTIES_VALUE_LOCKED', 'FTS_COUNT', 'FTS_VALUE_LOCKED', 'NFTS_COUNT', 'NFTS_VALUE_LOCKED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats" ALTER COLUMN "metric" TYPE "public"."dao_stats_metric_enum_old" USING "metric"::"text"::"public"."dao_stats_metric_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."dao_stats_metric_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_metric_enum_old" RENAME TO "dao_stats_metric_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dao_stats_history_metric_enum_old" AS ENUM('DAO_COUNT', 'ACTIONS_IN_COUNT', 'ACTIONS_OUT_COUNT', 'ACTIONS_FUNCTION_CALL_IN_COUNT', 'ACTIONS_FUNCTION_CALL_OUT_COUNT', 'ACTIONS_DEPOSIT_IN_COUNT', 'ACTIONS_DEPOSIT_IN_VALUE', 'ACTIONS_DEPOSIT_OUT_COUNT', 'ACTIONS_DEPOSIT_OUT_VALUE', 'GROUPS_COUNT', 'COUNCIL_SIZE', 'MEMBERS_COUNT', 'PROPOSALS_COUNT', 'PROPOSALS_TRANSFER_COUNT', 'PROPOSALS_COUNCIL_MEMBER_COUNT', 'PROPOSALS_POLICY_CHANGE_COUNT', 'PROPOSALS_IN_PROGRESS_COUNT', 'PROPOSALS_APPROVED_COUNT', 'PROPOSALS_REJECTED_COUNT', 'PROPOSALS_EXPIRED_COUNT', 'PROPOSALS_BOUNTY_COUNT', 'PROPOSALS_MEMBER_COUNT', 'BOUNTIES_COUNT', 'BOUNTIES_VALUE_LOCKED', 'FTS_COUNT', 'FTS_VALUE_LOCKED', 'NFTS_COUNT', 'NFTS_VALUE_LOCKED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" ALTER COLUMN "metric" TYPE "public"."dao_stats_history_metric_enum_old" USING "metric"::"text"::"public"."dao_stats_history_metric_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."dao_stats_history_metric_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."dao_stats_history_metric_enum_old" RENAME TO "dao_stats_history_metric_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daos" ADD "description" character varying`,
    );
  }
}

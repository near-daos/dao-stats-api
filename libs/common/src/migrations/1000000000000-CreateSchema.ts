import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaRefactoring1000000000000 implements MigrationInterface {
  name = 'SchemaRefactoring1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "contracts"
                             (
                                 "is_archived"   boolean                  NOT NULL DEFAULT false,
                                 "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "updated_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "contract_id"   character varying        NOT NULL,
                                 "contract_name" character varying,
                                 "description"   character varying,
                                 CONSTRAINT "PK_d4c091e72433a7125d9158170e7" PRIMARY KEY ("contract_id")
                             )`);
    await queryRunner.query(
      `CREATE TYPE "public"."dao_stats_history_metric_enum" AS ENUM('DAO_COUNT', 'GROUPS_COUNT', 'COUNCIL_SIZE', 'MEMBERS_COUNT', 'PROPOSALS_COUNT', 'PROPOSALS_PAYOUT_COUNT', 'PROPOSALS_COUNCIL_MEMBER_COUNT', 'PROPOSALS_POLICY_CHANGE_COUNT', 'PROPOSALS_IN_PROGRESS_COUNT', 'PROPOSALS_APPROVED_COUNT', 'PROPOSALS_REJECTED_COUNT', 'PROPOSALS_EXPIRED_COUNT', 'PROPOSALS_BOUNTY_COUNT', 'PROPOSALS_MEMBER_COUNT', 'BOUNTIES_COUNT', 'BOUNTIES_VALUE_LOCKED', 'FTS_COUNT', 'NFTS_COUNT')`,
    );
    await queryRunner.query(`CREATE TABLE "dao_stats_history"
                             (
                                 "date"        date                                     NOT NULL DEFAULT now(),
                                 "contract_id" character varying                        NOT NULL,
                                 "dao"         character varying                        NOT NULL,
                                 "metric"      "public"."dao_stats_history_metric_enum" NOT NULL,
                                 "value"       double precision                         NOT NULL DEFAULT '0',
                                 CONSTRAINT "PK_022664e67c592811c0b9c8de1f4" PRIMARY KEY ("date", "contract_id", "dao", "metric")
                             )`);
    await queryRunner.query(
      `CREATE TYPE "public"."dao_stats_metric_enum" AS ENUM('DAO_COUNT', 'GROUPS_COUNT', 'COUNCIL_SIZE', 'MEMBERS_COUNT', 'PROPOSALS_COUNT', 'PROPOSALS_PAYOUT_COUNT', 'PROPOSALS_COUNCIL_MEMBER_COUNT', 'PROPOSALS_POLICY_CHANGE_COUNT', 'PROPOSALS_IN_PROGRESS_COUNT', 'PROPOSALS_APPROVED_COUNT', 'PROPOSALS_REJECTED_COUNT', 'PROPOSALS_EXPIRED_COUNT', 'PROPOSALS_BOUNTY_COUNT', 'PROPOSALS_MEMBER_COUNT', 'BOUNTIES_COUNT', 'BOUNTIES_VALUE_LOCKED', 'FTS_COUNT', 'NFTS_COUNT')`,
    );
    await queryRunner.query(`CREATE TABLE "dao_stats"
                             (
                                 "contract_id" character varying                NOT NULL,
                                 "dao"         character varying                NOT NULL,
                                 "metric"      "public"."dao_stats_metric_enum" NOT NULL,
                                 "value"       double precision                 NOT NULL DEFAULT '0',
                                 CONSTRAINT "PK_f880e10563bf060d8a064aaff52" PRIMARY KEY ("contract_id", "dao", "metric")
                             )`);
    await queryRunner.query(`CREATE TABLE "daos"
                             (
                                 "is_archived" boolean                  NOT NULL DEFAULT false,
                                 "created_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "updated_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "dao"         character varying        NOT NULL,
                                 "contract_id" character varying        NOT NULL,
                                 "description" character varying,
                                 "metadata"    json,
                                 CONSTRAINT "PK_8516550c3514d3e6a4767ab58dc" PRIMARY KEY ("dao")
                             )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_fc54110a641dfedb702c5b402a" ON "daos" ("contract_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('CREATE_DAO', 'ADD_PROPOSAL', 'ACT_PROPOSAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_vote_type_enum" AS ENUM('VOTE_APPROVE', 'VOTE_REJECT')`,
    );
    await queryRunner.query(`CREATE TABLE "transactions"
                             (
                                 "is_archived"                     boolean                  NOT NULL DEFAULT false,
                                 "created_at"                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "updated_at"                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                                 "transaction_hash"                character varying        NOT NULL,
                                 "contract_id"                     character varying        NOT NULL,
                                 "receiver_account_id"             character varying        NOT NULL,
                                 "signer_account_id"               character varying        NOT NULL,
                                 "status"                          character varying        NOT NULL,
                                 "converted_into_receipt_id"       character varying        NOT NULL,
                                 "receipt_conversion_gas_burnt"    character varying        NOT NULL,
                                 "receipt_conversion_tokens_burnt" character varying        NOT NULL,
                                 "block_timestamp"                 bigint                   NOT NULL,
                                 "type"                            "public"."transactions_type_enum",
                                 "vote_type"                       "public"."transactions_vote_type_enum",
                                 CONSTRAINT "PK_b53cfe42d3c5c88fe715b9432ba" PRIMARY KEY ("transaction_hash")
                             )`);
    await queryRunner.query(`CREATE TABLE "action_receipt_actions"
                             (
                                 "receipt_id"                     character varying NOT NULL,
                                 "contract_id"                    character varying,
                                 "index_in_action_receipt"        integer           NOT NULL,
                                 "receipt_predecessor_account_id" character varying NOT NULL,
                                 "receipt_receiver_account_id"    character varying NOT NULL,
                                 "action_kind"                    character varying NOT NULL,
                                 "args"                           text,
                                 "args_json"                      json,
                                 "included_in_block_timestamp"    bigint,
                                 CONSTRAINT "PK_a911bb227e9ca404181b2e14fc5" PRIMARY KEY ("receipt_id", "index_in_action_receipt")
                             )`);
    await queryRunner.query(`CREATE TABLE "receipts"
                             (
                                 "receipt_id"                       character varying NOT NULL,
                                 "contract_id"                      character varying,
                                 "predecessor_account_id"           character varying NOT NULL,
                                 "receiver_account_id"              character varying NOT NULL,
                                 "originated_from_transaction_hash" character varying NOT NULL,
                                 "included_in_block_timestamp"      bigint            NOT NULL,
                                 CONSTRAINT "PK_8613250be825686eb9bf90189b7" PRIMARY KEY ("receipt_id")
                             )`);
    await queryRunner.query(`ALTER TABLE "dao_stats_history"
        ADD CONSTRAINT "FK_c40ae059ba9e4d886d47031d072" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "dao_stats"
        ADD CONSTRAINT "FK_50c71c9c6fc1a9191a1d99b263a" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "transactions"
        ADD CONSTRAINT "FK_bfe2efd1fdd9675f2f64d75d51c" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "action_receipt_actions"
        ADD CONSTRAINT "FK_aa06ccb9340d1f6442dedfaf771" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "action_receipt_actions"
        ADD CONSTRAINT "FK_f872f78aa8038ac1f381113ce1f" FOREIGN KEY ("receipt_id") REFERENCES "receipts" ("receipt_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "receipts"
        ADD CONSTRAINT "FK_9adfba1b3d10b3b4d26e1d727e2" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "receipts"
        ADD CONSTRAINT "FK_93d128dee44b66d36cadb92628a" FOREIGN KEY ("originated_from_transaction_hash") REFERENCES "transactions" ("transaction_hash") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "receipts" DROP CONSTRAINT "FK_93d128dee44b66d36cadb92628a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "receipts" DROP CONSTRAINT "FK_9adfba1b3d10b3b4d26e1d727e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_receipt_actions" DROP CONSTRAINT "FK_f872f78aa8038ac1f381113ce1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_receipt_actions" DROP CONSTRAINT "FK_aa06ccb9340d1f6442dedfaf771"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_bfe2efd1fdd9675f2f64d75d51c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats" DROP CONSTRAINT "FK_50c71c9c6fc1a9191a1d99b263a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dao_stats_history" DROP CONSTRAINT "FK_c40ae059ba9e4d886d47031d072"`,
    );
    await queryRunner.query(`DROP TABLE "receipts"`);
    await queryRunner.query(`DROP TABLE "action_receipt_actions"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_vote_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc54110a641dfedb702c5b402a"`,
    );
    await queryRunner.query(`DROP TABLE "daos"`);
    await queryRunner.query(`DROP TABLE "dao_stats"`);
    await queryRunner.query(`DROP TYPE "public"."dao_stats_metric_enum"`);
    await queryRunner.query(`DROP TABLE "dao_stats_history"`);
    await queryRunner.query(
      `DROP TYPE "public"."dao_stats_history_metric_enum"`,
    );
    await queryRunner.query(`DROP TABLE "contracts"`);
  }
}

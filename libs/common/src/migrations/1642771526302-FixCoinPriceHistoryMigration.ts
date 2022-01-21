import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCoinPriceHistoryMigration1642771526302
  implements MigrationInterface
{
  name = 'FixCoinPriceHistoryMigration1642771526302';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coin_price_history" RENAME TO "coin_price_history_old"`,
    );
    await queryRunner.query(
      `CREATE TABLE "coin_price_history" ("date" date NOT NULL DEFAULT now(), "coin" text NOT NULL, "currency" text NOT NULL, "price" numeric NOT NULL DEFAULT '0', CONSTRAINT "PK_7862f99ff728470a5a5c4bdf2ba" PRIMARY KEY ("date", "coin", "currency"))`,
    );
    await queryRunner.query(
      `INSERT INTO "coin_price_history" SELECT * FROM "coin_price_history_old"`,
    );
    await queryRunner.query('DROP TABLE "coin_price_history_old"');
    await queryRunner.query(
      `ALTER TABLE "contracts" ALTER COLUMN "coin" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" ALTER COLUMN "coin" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coin_price_history" RENAME TO "coin_price_history_old"`,
    );
    await queryRunner.query(`CREATE TABLE "coin_price_history"
                               (
                                   "date"        date                                     NOT NULL DEFAULT now(),
                                   "coin"        character varying                        NOT NULL,
                                   "currency"    character varying                        NOT NULL,
                                   "price"       decimal                                  NOT NULL DEFAULT '0',
                                   PRIMARY KEY ("date", "coin", "currency")
                               )`);
    await queryRunner.query(
      `INSERT INTO "coin_price_history" SELECT * FROM "coin_price_history_old"`,
    );
    await queryRunner.query(`DROP TABLE "coin_price_history_old"`);
  }
}

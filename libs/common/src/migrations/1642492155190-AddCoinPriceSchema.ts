import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoinPriceSchema1642492155190 implements MigrationInterface {
  name = 'AddCoinPriceSchema1642492155190';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "coin_price_history"
                             (
                                 "date"        date                                     NOT NULL DEFAULT now(),
                                 "coin"        character varying                        NOT NULL,
                                 "currency"    character varying                        NOT NULL,
                                 "price"       decimal                                  NOT NULL DEFAULT '0',
                                 PRIMARY KEY ("date", "coin", "currency")
                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coin_price_history"`);
  }
}

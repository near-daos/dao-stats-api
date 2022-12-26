import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaFix1647948205622 implements MigrationInterface {
  name = 'SchemaFix1647948205622';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coin_price_history" ALTER COLUMN "coin" TYPE text USING "coin"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "coin_price_history" ALTER COLUMN "currency" TYPE text USING "currency"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ALTER COLUMN "coin" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" ALTER COLUMN "coin" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "coin_price_history" ALTER COLUMN "currency" TYPE varchar USING "currency"::varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "coin_price_history" ALTER COLUMN "coin" TYPE varchar USING "coin"::varchar`,
    );
  }
}

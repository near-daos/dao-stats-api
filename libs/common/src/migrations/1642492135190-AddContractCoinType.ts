import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractCoinType1642492135190 implements MigrationInterface {
  name = 'AddContractCoinType1642492135190';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table contracts add column if not exists coin text`,
    );

    await queryRunner.query(
      `update contracts set coin = 'NEAR' where contract_id = 'astro'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`alter table contracts drop column coin`);
  }
}

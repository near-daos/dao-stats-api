import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractConversionFactor1639933196415
  implements MigrationInterface
{
  name = 'AddContractConversionFactor1639933196415';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table contracts add column if not exists conversion_factor decimal`,
    );

    await queryRunner.query(
      `update contracts set conversion_factor = 1e24 where contract_id = 'astro'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `alter table contracts drop column conversion_factor`,
    );
  }
}

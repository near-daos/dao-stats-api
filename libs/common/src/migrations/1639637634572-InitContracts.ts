import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitContracts1639584157798 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    type CONTRACT_ENV = 'testnet' | 'mainnet';

    const contractEnv = (process.env.CONTRACT_ENV as CONTRACT_ENV) || 'testnet';

    const astroContractName = {
      testnet: 'sputnikv2.testnet',
      mainnet: 'sputnik-dao.near',
    };

    await queryRunner.query(
      'create table if not exists contracts (contract_id varchar(255) unique not null, contract_name varchar(255) , description varchar(255))',
    );
    await queryRunner.query(
      `insert into contracts (contract_id, contract_name, description) values ('astro', '${astroContractName[contractEnv]}', '') on conflict do nothing`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // doing nothing since it is considered as initial migration
  }
}

import dotenv from 'dotenv';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitContracts1639584157798 implements MigrationInterface {
  constructor() {
    dotenv.config();
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    type CONTRACT_ENV = 'testnet' | 'mainnet';

    const contractEnv = (process.env.CONTRACT_ENV as CONTRACT_ENV) || 'testnet';

    const astroContractName = {
      testnet: 'sputnikv2.testnet',
      mainnet: 'sputnik-dao.near',
    };

    await queryRunner.query(
      `insert into contracts (contract_id, contract_name, description) values ('astro', '${astroContractName[contractEnv]}', '') on conflict do nothing`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // doing nothing since it is considered as initial migration
  }
}

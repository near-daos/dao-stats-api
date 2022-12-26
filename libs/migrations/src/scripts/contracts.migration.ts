import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from '@dao-stats/common';
import { Migration } from '..';

@Injectable()
export class ContractsMigration implements Migration {
  private readonly logger = new Logger(ContractsMigration.name);

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  public async migrate(): Promise<void> {
    this.logger.log('Starting Contracts migration...');

    const contracts = process.env.SMART_CONTRACTS.split(',');

    await this.contractRepository.save(
      contracts.map((contract) => ({
        contractId: contract,
      })),
    );

    this.logger.log('Finished Contracts migration.');
  }
}

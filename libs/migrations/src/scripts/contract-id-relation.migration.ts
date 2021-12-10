import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PromisePool from '@supercharge/promise-pool';
import { Transaction } from '@dao-stats/common';
import { Migration } from '..';

@Injectable()
export class ContractIdRelationMigration implements Migration {
  private readonly logger = new Logger(ContractIdRelationMigration.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  public async migrate(): Promise<void> {
    this.logger.log('Starting Contract ID migration...');

    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.receipts', 'receipts')
      .leftJoinAndSelect('receipts.receiptActions', 'action_receipt_actions')
      .getMany();

    await PromisePool.withConcurrency(500)
      .for(transactions)
      .handleError((error) => {
        this.logger.error(error);
      })
      .process(async (tx) => {
        await this.transactionRepository.save({
          ...tx,
          receipts: tx.receipts.map((receipt) => ({
            ...receipt,
            contractId: tx.contractId,
            receiptActions: receipt.receiptActions.map((receiptAction) => ({
              ...receiptAction,
              contractId: tx.contractId,
            })),
          })),
        });
      });

    this.logger.log('Finished Contract ID migration.');
  }
}

import { IsNull, Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PromisePool from '@supercharge/promise-pool';
import { ReceiptAction } from '@dao-stats/common';
import { Migration } from '..';

@Injectable()
export class ReceiptActionBlockTimestampMigration implements Migration {
  private readonly logger = new Logger(
    ReceiptActionBlockTimestampMigration.name,
  );

  constructor(
    @InjectRepository(ReceiptAction)
    private readonly receiptActionRepository: Repository<ReceiptAction>,
  ) {}

  public async migrate(): Promise<void> {
    this.logger.log('Starting Receipt Action block timestamp migration...');

    const receiptActions = await this.receiptActionRepository.find({
      where: {
        includedInBlockTimestamp: IsNull(),
      },
    });

    await PromisePool.withConcurrency(500)
      .for(
        receiptActions.map((action) => ({
          ...action,
          includedInBlockTimestamp: action.receipt.includedInBlockTimestamp,
        })),
      )
      .handleError((error) => {
        this.logger.error(error);
      })
      .process(async (action) => {
        await this.receiptActionRepository.save(action);
      });

    this.logger.log('Finished Receipt Action block timestamp migration.');
  }
}

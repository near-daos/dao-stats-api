import { Connection, SelectQueryBuilder } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NEAR_INDEXER_DB_CONNECTION } from './constants';
import { Transaction } from './entities';

@Injectable()
export class NearIndexerService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(NEAR_INDEXER_DB_CONNECTION)
    private connection: Connection,
  ) {}

  /** Pass either single accountId or array of accountIds */
  async findLastTransactionByAccountIds(
    accountIds: string | string[],
    fromBlockTimestamp?: bigint,
  ): Promise<Transaction> {
    return this.buildAggregationTransactionQuery(accountIds, fromBlockTimestamp)
      .select('transaction.transactionHash')
      .orderBy('transaction.block_timestamp', 'ASC')
      .getOne();
  }

  /** Pass either single accountId or array of accountIds */
  async findTransactionsByAccountIds(
    accountIds: string | string[],
    fromBlockTimestamp?: bigint,
    toBlockTimestamp?: bigint,
  ): Promise<Transaction[]> {
    return this.buildAggregationTransactionQuery(
      accountIds,
      fromBlockTimestamp,
      toBlockTimestamp,
    )
      .orderBy('transaction.block_timestamp', 'ASC')
      .getMany();
  }

  async findTransaction(transactionHash: string): Promise<Transaction> {
    return this.connection.getRepository(Transaction).findOne(transactionHash);
  }

  private buildAggregationTransactionQuery(
    accountIds: string | string[],
    fromBlockTimestamp?: bigint,
    toBlockTimestamp?: bigint,
  ): SelectQueryBuilder<Transaction> {
    const queryBuilder = this.connection
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.receipts', 'receipts')
      .leftJoinAndSelect('receipts.receiptActions', 'action_receipt_actions');

    if (Array.isArray(accountIds)) {
      queryBuilder.where('transaction.receiver_account_id IN (:...ids)', {
        ids: accountIds,
      });
    } else {
      queryBuilder.where('transaction.receiver_account_id LIKE :id', {
        id: `%${accountIds}`,
      });
    }

    if (fromBlockTimestamp) {
      queryBuilder.andWhere('transaction.block_timestamp >= :from', {
        from: String(fromBlockTimestamp),
      });
    }

    if (toBlockTimestamp) {
      queryBuilder.andWhere('transaction.block_timestamp <= :to', {
        to: String(toBlockTimestamp),
      });
    }

    return queryBuilder;
  }
}

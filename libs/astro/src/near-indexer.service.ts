import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Repository, SelectQueryBuilder } from 'typeorm';
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
    fromBlockTimestamp?: number,
  ): Promise<Transaction> {
    return this.buildAggregationTransactionQuery(
      this.connection.getRepository(Transaction),
      accountIds,
      fromBlockTimestamp,
    )
      .select('transaction.transactionHash')
      .orderBy('transaction.block_timestamp', 'ASC')
      .getOne();
  }

  /** Pass either single accountId or array of accountIds */
  async findTransactionsByAccountIds(
    accountIds: string | string[],
    fromBlockTimestamp?: number,
    toBlockTimestamp?: number,
  ): Promise<Transaction[]> {
    return this.buildAggregationTransactionQuery(
      this.connection.getRepository(Transaction),
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
    repository: Repository<Transaction>,
    accountIds: string | string[],
    fromBlockTimestamp?: number,
    toBlockTimestamp?: number,
  ): SelectQueryBuilder<Transaction> {
    let queryBuilder = repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.receipts', 'receipts')
      .leftJoinAndSelect('receipts.receiptActions', 'action_receipt_actions');

    queryBuilder =
      accountIds instanceof Array
        ? queryBuilder.where(
            'transaction.receiver_account_id = ANY(ARRAY[:...ids])',
            {
              ids: accountIds,
            },
          )
        : queryBuilder.where('transaction.receiver_account_id LIKE :id', {
            id: `%${accountIds}`,
          });

    queryBuilder = fromBlockTimestamp
      ? queryBuilder.andWhere('transaction.block_timestamp > :from', {
          from: fromBlockTimestamp,
        })
      : queryBuilder;

    queryBuilder = toBlockTimestamp
      ? queryBuilder.andWhere('transaction.block_timestamp < :to', {
          to: toBlockTimestamp,
        })
      : queryBuilder;

    return queryBuilder;
  }
}

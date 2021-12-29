import { Connection, SelectQueryBuilder } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NEAR_INDEXER_DB_CONNECTION } from './constants';
import { ReceiptAction, Transaction } from './entities';

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

  buildReceiptActionsQuery({
    predecessorAccountId,
    receiverAccountId,
    isDeposit,
    actionKind,
  }: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
    isDeposit?: boolean;
    actionKind?: string;
  }): SelectQueryBuilder<ReceiptAction> {
    const query = this.connection
      .getRepository(ReceiptAction)
      .createQueryBuilder();

    if (actionKind) {
      query.andWhere('action_kind = :actionKind', { actionKind });
    }

    if (predecessorAccountId) {
      query.andWhere('receipt_predecessor_account_id = :predecessorAccountId', {
        predecessorAccountId,
      });
    }

    if (receiverAccountId) {
      query.andWhere('receipt_receiver_account_id = :receiverAccountId', {
        receiverAccountId,
      });
    }

    if (isDeposit) {
      query.andWhere(`args -> 'deposit' is not null`);
    }

    return query;
  }

  async getReceiptActionsCount(params: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
  }): Promise<number> {
    return this.buildReceiptActionsQuery(params).getCount();
  }

  async getReceiptActionsFunctionCallCount(params: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
  }): Promise<number> {
    return this.buildReceiptActionsQuery({
      ...params,
      actionKind: 'FUNCTION_CALL',
    }).getCount();
  }

  async getReceiptActionsDepositCount(params: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
  }): Promise<number> {
    return this.buildReceiptActionsQuery({
      ...params,
      isDeposit: true,
    }).getCount();
  }

  async getReceiptActionsDepositAmount(params: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
  }): Promise<string> {
    const [result] = await this.buildReceiptActionsQuery({
      ...params,
      isDeposit: true,
    })
      .select(`sum((args ->> 'deposit')::decimal)`)
      .execute();

    if (!result || !result['sum']) {
      return '0';
    }

    return result['sum'];
  }

  async getDaoCountDaily(
    contractId: string,
  ): Promise<{ date: string; value: number }[]> {
    return this.connection.query(
      `
      with data as (
        select date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9)) as date, count(1) as count
        from action_receipt_actions ara
        left join execution_outcomes eo on ara.receipt_id = eo.receipt_id
        where
              ara.action_kind = 'FUNCTION_CALL'
          and ara.args ->> 'method_name' = 'new'
          and ara.receipt_predecessor_account_id = $1
          and ara.receipt_receiver_account_id like $2
          and eo.status = 'SUCCESS_VALUE'
        group by date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9))
      )
      select
          date,
          sum(count) over (order by date rows between unbounded preceding and current row)::int as value
      from data
    `,
      [contractId, `%.${contractId}`],
    );
  }
}

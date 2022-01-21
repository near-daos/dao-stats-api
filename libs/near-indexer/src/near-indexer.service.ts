import { Brackets, Connection, SelectQueryBuilder } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NEAR_INDEXER_DB_CONNECTION } from './constants';
import { ReceiptAction } from './entities';

@Injectable()
export class NearIndexerService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(NEAR_INDEXER_DB_CONNECTION)
    private connection: Connection,
  ) {}

  buildAggregationReceiptActionQuery(
    accountIds: string | string[],
    fromBlockTimestamp?: bigint,
    toBlockTimestamp?: bigint,
  ): SelectQueryBuilder<ReceiptAction> {
    const queryBuilder = this.connection
      .getRepository(ReceiptAction)
      .createQueryBuilder('receipt_action')
      .leftJoinAndSelect('receipt_action.receipt', 'receipt')
      .leftJoinAndSelect('receipt.originatedFromTransaction', 'transaction');

    if (Array.isArray(accountIds)) {
      queryBuilder.where(
        new Brackets((qb) =>
          qb
            .where(
              `receipt_action.receipt_predecessor_account_id IN (:...ids)`,
              {
                ids: accountIds,
              },
            )
            .orWhere(
              `receipt_action.receipt_receiver_account_id IN (:...ids)`,
              {
                ids: accountIds,
              },
            ),
        ),
      );
    } else {
      queryBuilder.where(
        new Brackets((qb) =>
          qb
            .where(`receipt_action.receipt_predecessor_account_id LIKE :id`, {
              id: `%.${accountIds}`,
            })
            .orWhere(`receipt_action.receipt_receiver_account_id LIKE :id`, {
              id: `%.${accountIds}`,
            }),
        ),
      );
    }

    if (fromBlockTimestamp) {
      queryBuilder.andWhere(
        'receipt_action.receipt_included_in_block_timestamp >= :from',
        {
          from: String(fromBlockTimestamp),
        },
      );
    }

    if (toBlockTimestamp) {
      queryBuilder.andWhere(
        'receipt_action.receipt_included_in_block_timestamp <= :to',
        {
          to: String(toBlockTimestamp),
        },
      );
    }

    return queryBuilder;
  }

  buildReceiptActionsQuery({
    predecessorAccountId,
    predecessorAccountIdCond = '=',
    receiverAccountId,
    receiverAccountIdCond = '=',
    isDeposit,
    actionKind,
    daily,
  }: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
    isDeposit?: boolean;
    actionKind?: string;
    daily?: boolean;
  }): SelectQueryBuilder<ReceiptAction> {
    const query = this.connection
      .getRepository(ReceiptAction)
      .createQueryBuilder('ara')
      .leftJoin('execution_outcomes', 'eo', 'ara.receipt_id = eo.receipt_id');

    if (actionKind) {
      query.andWhere('action_kind = :actionKind', { actionKind });
    }

    if (predecessorAccountId) {
      query.andWhere(
        `ara.receipt_predecessor_account_id ${predecessorAccountIdCond} :predecessorAccountId`,
        {
          predecessorAccountId,
        },
      );
    }

    if (receiverAccountId) {
      query.andWhere(
        `ara.receipt_receiver_account_id ${receiverAccountIdCond} :receiverAccountId`,
        {
          receiverAccountId,
        },
      );
    }

    query.andWhere(`eo.status != 'FAILURE'`);

    if (isDeposit) {
      query.andWhere(`ara.args -> 'deposit' is not null`);
      query.andWhere(`ara.args ->> 'deposit' != '0'`);
    }

    if (daily) {
      query.select(
        'date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9)) as date',
      );
      query.groupBy(
        'date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9))',
      );
    }

    return query;
  }

  async getReceiptActionsCount(params: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
  }): Promise<number> {
    return this.buildReceiptActionsQuery(params).getCount();
  }

  async getReceiptActionsFunctionCallCount(params: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
  }): Promise<number> {
    return this.buildReceiptActionsQuery({
      ...params,
      actionKind: 'FUNCTION_CALL',
    }).getCount();
  }

  async getReceiptActionsDepositCount(params: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
  }): Promise<number> {
    return this.buildReceiptActionsQuery({
      ...params,
      isDeposit: true,
    }).getCount();
  }

  async getReceiptActionsDepositAmount(params: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
  }): Promise<string> {
    const [result] = await this.buildReceiptActionsQuery({
      ...params,
      isDeposit: true,
    })
      .select(`sum((ara.args ->> 'deposit')::decimal) as amount`)
      .execute();

    if (result && result.amount) {
      return result.amount;
    }

    return '0';
  }

  async getReceiptActionsDepositCountDaily(params: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
  }): Promise<{ date: Date; change: number; total: number }[]> {
    const [query, parameters] = this.buildReceiptActionsQuery({
      ...params,
      isDeposit: true,
      daily: true,
    })
      .addSelect(`count(1) as value`)
      .getQueryAndParameters();

    return this.connection.query(
      `
          with data as (${query})
          select date, 
                 value as change,
                 sum(value) over (order by date rows between unbounded preceding and current row) as total
          from data
      `,
      parameters,
    );
  }

  async getReceiptActionsDepositAmountDaily(params: {
    predecessorAccountId?: string;
    predecessorAccountIdCond?: string;
    receiverAccountId?: string;
    receiverAccountIdCond?: string;
  }): Promise<{ date: Date; change: string; total: string }[]> {
    const [query, parameters] = this.buildReceiptActionsQuery({
      ...params,
      isDeposit: true,
      daily: true,
    })
      .addSelect(`sum((ara.args ->> 'deposit')::decimal) as value`)
      .getQueryAndParameters();

    return this.connection.query(
      `
          with data as (${query})
          select date, 
                 value as change,
                 sum(value) over (order by date rows between unbounded preceding and current row) as total
          from data
      `,
      parameters,
    );
  }

  async getDaoCountDaily(
    contractId: string,
  ): Promise<{ date: Date; change: number; total: number }[]> {
    return this.connection.query(
      `
          with data as (
              select date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9)) as date, count(1) as value
              from action_receipt_actions ara
              left join execution_outcomes eo on ara.receipt_id = eo.receipt_id
              where ara.action_kind = 'FUNCTION_CALL'
                and ara.args ->> 'method_name' = 'new'
                and ara.receipt_predecessor_account_id = $1
                and ara.receipt_receiver_account_id like $2
                and eo.status != 'FAILURE'
              group by date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9))
          )
          select date,
                 value as change,
                 sum(value) over (order by date rows between unbounded preceding and current row) as total
          from data
      `,
      [contractId, `%.${contractId}`],
    );
  }

  // This method returns balance slightly different from state
  // TODO: find cause and fix query
  async getAccountBalanceDaily(
    accountId: string,
  ): Promise<{ date: Date; change: string; total: string }[]> {
    return this.connection.query(
      `
          with deposits as (
              select date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9)) as date,
                     sum((args ->> 'deposit')::decimal)                                as value
              from action_receipt_actions ara
              left join execution_outcomes eo on ara.receipt_id = eo.receipt_id
              where receipt_receiver_account_id = $1
                and eo.status != 'FAILURE'
                and args -> 'deposit' is not null
                and args ->> 'deposit' != '0'
              group by date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9))
          ),
               withdrawals as (
                   select date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9)) as date,
                          -sum((args ->> 'deposit')::decimal)                                as value
                   from action_receipt_actions ara
                   left join execution_outcomes eo on ara.receipt_id = eo.receipt_id
                   where receipt_predecessor_account_id = $1
                     and eo.status != 'FAILURE'
                     and args -> 'deposit' is not null
                     and args ->> 'deposit' != '0'
                   group by date(to_timestamp(ara.receipt_included_in_block_timestamp / 1e9))
               ),
               balance as (
                   select date,
                          coalesce(deposits.value, 0) + coalesce(withdrawals.value, 0) as value
                   from deposits
                   full outer join withdrawals using (date)
               )
          select date, 
                 value as change, 
                 sum(value) over (order by date rows between unbounded preceding and current row) as total
          from balance;
      `,
      [accountId],
    );
  }
}

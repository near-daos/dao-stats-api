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
              id: `%${accountIds}`,
            })
            .orWhere(`receipt_action.receipt_receiver_account_id LIKE :id`, {
              id: `%${accountIds}`,
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
    receiverAccountId,
    isDeposit,
    actionKind,
    daily,
  }: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
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
        'ara.receipt_predecessor_account_id = :predecessorAccountId',
        {
          predecessorAccountId,
        },
      );
    }

    if (receiverAccountId) {
      query.andWhere('ara.receipt_receiver_account_id = :receiverAccountId', {
        receiverAccountId,
      });
    }

    if (isDeposit) {
      query.andWhere(`ara.args -> 'deposit' is not null`);
      query.andWhere(`ara.args ->> 'deposit' != '0'`);
    }

    query.andWhere(`eo.status != 'FAILURE'`);

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
      .select(`sum((ara.args ->> 'deposit')::decimal)`)
      .execute();

    if (!result || !result['sum']) {
      return '0';
    }

    return result['sum'];
  }

  async getReceiptActionsDepositCountDaily(params: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
  }): Promise<{ date: Date; value: number }[]> {
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
      select date, sum(value) over (order by date rows between unbounded preceding and current row) as value
      from data
    `,
      parameters,
    );
  }

  async getReceiptActionsDepositAmountDaily(params: {
    predecessorAccountId?: string;
    receiverAccountId?: string;
  }): Promise<{ date: Date; value: string }[]> {
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
      select date, sum(value) over (order by date rows between unbounded preceding and current row) as value
      from data
    `,
      parameters,
    );
  }

  async getDaoCountDaily(
    contractId: string,
  ): Promise<{ date: Date; value: number }[]> {
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
      select
          date,
          sum(value) over (order by date rows between unbounded preceding and current row) as value
      from data
    `,
      [contractId, `%.${contractId}`],
    );
  }
}

import { Brackets, Connection, SelectQueryBuilder } from 'typeorm';
import { Cacheable } from '@type-cacheable/core';
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
          select date,
                 sum(value) over (order by date rows between unbounded preceding and current row) as value
          from data
      `,
      [contractId, `%.${contractId}`],
    );
  }

  // This method returns balance slightly different from state
  // TODO: find cause and fix query
  async getAccountBalanceDaily(
    accountId: string,
  ): Promise<{ date: Date; value: number }[]> {
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
          select date, sum(value) over (order by date rows between unbounded preceding and current row) as value
          from balance;
      `,
      [accountId],
    );
  }

  // Account Likely Tokens - taken from NEAR Helper Indexer middleware
  // https://github.com/near/near-contract-helper/blob/master/middleware/indexer.js
  @Cacheable({
    ttlSeconds: 300,
    cacheKey: ([accountId], context) =>
      `likely_tokens:${context.env}:${accountId}`,
  })
  async findLikelyTokens(accountId: string): Promise<string[]> {
    const { bridgeTokenFactoryContractName } = this.configService.get('near');

    const received = `
        select distinct receipt_receiver_account_id as receiver_account_id
        from action_receipt_actions
        where args->'args_json'->>'receiver_id' = $1
            and action_kind = 'FUNCTION_CALL'
            and args->>'args_json' is not null
            and args->>'method_name' in ('ft_transfer', 'ft_transfer_call','ft_mint')
    `;

    const mintedWithBridge = `
        select distinct receipt_receiver_account_id as receiver_account_id from (
            select args->'args_json'->>'account_id' as account_id, receipt_receiver_account_id
            from action_receipt_actions
            where action_kind = 'FUNCTION_CALL' and
                receipt_predecessor_account_id = $2 and
                args->>'method_name' = 'mint'
        ) minted_with_bridge
        where account_id = $1
    `;

    const calledByUser = `
        select distinct receipt_receiver_account_id as receiver_account_id
        from action_receipt_actions
        where receipt_predecessor_account_id = $1
            and action_kind = 'FUNCTION_CALL'
            and (args->>'method_name' like 'ft_%' or args->>'method_name' = 'storage_deposit')
    `;

    const ownershipChangeEvents = `
        select distinct emitted_by_contract_account_id as receiver_account_id 
        from assets__fungible_token_events
        where token_new_owner_account_id = $1
    `;

    const [
      receivedTokens,
      mintedWithBridgeTokens,
      calledByUserTokens,
      ownershipChangeEventsTokens,
    ] = await Promise.all([
      this.connection.query(received, [accountId]),
      this.connection.query(mintedWithBridge, [
        accountId,
        bridgeTokenFactoryContractName,
      ]),
      this.connection.query(calledByUser, [accountId]),
      this.connection.query(ownershipChangeEvents, [accountId]),
    ]);

    return [
      ...new Set(
        [
          ...receivedTokens,
          ...mintedWithBridgeTokens,
          ...calledByUserTokens,
          ...ownershipChangeEventsTokens,
        ].map(({ receiver_account_id }) => receiver_account_id),
      ),
    ];
  }

  // Account Likely NFTs - taken from NEAR Helper Indexer middleware
  // https://github.com/near/near-contract-helper/blob/master/middleware/indexer.js
  @Cacheable({
    ttlSeconds: 300,
    cacheKey: ([accountId], context) =>
      `likely_nfts:${context.env}:${accountId}`,
  })
  async findLikelyNFTs(accountId: string): Promise<string[]> {
    const ownershipChangeFunctionCalls = `
        select distinct receipt_receiver_account_id as receiver_account_id
        from action_receipt_actions
        where args->'args_json'->>'receiver_id' = $1
            and action_kind = 'FUNCTION_CALL'
            and args->>'args_json' is not null
            and args->>'method_name' like 'nft_%'
    `;

    const ownershipChangeEvents = `
        select distinct emitted_by_contract_account_id as receiver_account_id 
        from assets__non_fungible_token_events
        where token_new_owner_account_id = $1
    `;

    const receivedTokens = await Promise.all([
      this.connection.query(ownershipChangeFunctionCalls, [accountId]),
      this.connection.query(ownershipChangeEvents, [accountId]),
    ]);

    return [
      ...new Set(
        receivedTokens
          .flat()
          .map(({ receiver_account_id }) => receiver_account_id),
      ),
    ];
  }
}

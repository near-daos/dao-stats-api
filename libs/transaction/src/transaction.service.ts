import { Connection, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import {
  ContractContext,
  DaoContractContext,
  MetricQuery,
  Transaction,
  TransactionType,
} from '@dao-stats/common';
import { TransactionLeaderboardDto } from './dto/transaction-leaderboard.dto';
import { DailyCountDto } from '@dao-stats/common/dto/daily-count.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectConnection()
    private connection: Connection,
  ) {}

  create(transactions: Transaction[]): Promise<Transaction[]> {
    return this.transactionRepository.save(transactions);
  }

  lastTransaction(contractId: string): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: { contractId },
      order: { blockTimestamp: 'DESC' },
    });
  }

  async getTotalCount(
    context: DaoContractContext | ContractContext,
    txType: TransactionType,
    metricQuery?: MetricQuery,
  ): Promise<number> {
    return this.getTotalCountQuery(context, metricQuery, txType).getCount();
  }

  async getTotalCountDaily(
    context: DaoContractContext | ContractContext,
    txType: TransactionType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const query = `
        with data as (
          select
            date_trunc('day', to_timestamp(block_timestamp / 1000 / 1000 / 1000)) as day,
            count(1)
          from transactions
          where contract_id = '${contract}' and type = '${txType}'
          ${dao ? `and receiver_account_id = '${dao}'` : ''}
          ${from ? `and (block_timestamp / 1000 / 1000) > ${from}` : ''}
          ${to ? `and (block_timestamp / 1000 / 1000) < ${to}` : ''}
          group by 1
        )
        
        select
          day,
          sum(count) over (order by day asc rows between unbounded preceding and current row) as count
        from data
    `;

    return this.connection.query(query);
  }

  async getContractActivityCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<number> {
    return (
      await this.getContractActivityCountQuery(context, metricQuery).execute()
    )?.[0].count;
  }

  async getContractActivityCountDaily(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    let queryBuilder = this.getContractActivityCountQuery(context, metricQuery);
    queryBuilder = this.addDailySelection(queryBuilder);

    return queryBuilder.execute();
  }

  async getContractActivityLeaderboard(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    const { CreateDao } = TransactionType;
    const { from, to } = metricQuery || {};

    let queryBuilder = this.getTransactionIntervalQueryBuilder(
      context,
      from,
      to,
    )
      .select(`count(receiver_account_id)::int as count`)
      .andWhere('type != :type', { type: CreateDao })
      .addSelect('receiver_account_id');

    if (daily) {
      queryBuilder = this.addDailySelection(queryBuilder);
    }

    return queryBuilder
      .addGroupBy('receiver_account_id')
      .addOrderBy('count', 'DESC')
      .execute();
  }

  async getUsersTotalCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery || {};

    return (
      await this.getTransactionIntervalQueryBuilder(context, from, to)
        .select('count(distinct signer_account_id)::int')
        .execute()
    )?.[0].count;
  }

  async getUsersTotalCountDaily(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery || {};

    return this.connection.query(
      `
        select count(distinct signer_account_id)::int from transactions 
        where contract_id = '${contract}'
        ${dao ? `and receiver_account_id = '${dao}'` : ''}
        ${to ? `and (block_timestamp / 1000 / 1000) < ${to}` : ''}
      `,
    );
  }

  async getUsersLeaderboard(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    const { CreateDao } = TransactionType;
    const { contract } = context;
    const { from, to } = metricQuery || {};

    return this.connection.query(
      `
        select count(distinct signer_account_id)::int, receiver_account_id from transactions 
        where contract_id = '${contract}' and type != '${CreateDao}'
        ${from ? `and (block_timestamp / 1000 / 1000) > ${from}` : ''}
        ${to ? `and (block_timestamp / 1000 / 1000) < ${to}` : ''}
        group by receiver_account_id
      `,
    );
  }

  async getUsersActivityQuery(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<any[]> {
    const { CreateDao } = TransactionType;
    const { contract } = context;
    const { from, to } = metricQuery;

    return this.connection.query(
      `
        select count(distinct signer_account_id)::int as count, receiver_account_id from transactions 
        where contract_id = '${contract}' and type != '${CreateDao}'
        ${from ? `and (block_timestamp / 1000 / 1000) > ${from}` : ''}
        ${to ? `and (block_timestamp / 1000 / 1000) < ${to}` : ''}
        group by receiver_account_id
        order by count DESC
        limit 10
    `,
    );
  }

  async getProposalsTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    let queryBuilder = this.getTransactionIntervalQueryBuilder(
      context,
      from,
      to,
    );

    queryBuilder = queryBuilder
      .andWhere('transaction.contractId = :contract', { contract })
      .andWhere('transaction.type = :type', {
        type: TransactionType.AddProposal,
      });

    queryBuilder = dao
      ? queryBuilder.andWhere('transaction.receiver_account_id = :dao', { dao })
      : queryBuilder;

    return queryBuilder.getCount();
  }

  async getTransactionTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    const qr = await this.connection.query(
      `
        select count(transaction_hash)::int from transactions 
        where contract_id = '${contract}'
        ${dao ? `and receiver_account_id = '${dao}'` : ''}
        ${from ? `and block_timestamp > ${from}` : ''}
        ${to ? `and block_timestamp < ${to}` : ''}
      `,
    );

    return qr?.[0]?.count;
  }

  async getProposalsLeaderboard(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<TransactionLeaderboardDto[]> {
    const { AddProposal } = TransactionType;

    return this.connection.query(`
        select count(signer_account_id)::int as count, receiver_account_id from transactions 
        where contract_id = '${contractId}' and type = '${AddProposal}'
        ${from ? `and (block_timestamp / 1000 / 1000) > ${from}` : ''}
        ${to ? `and (block_timestamp / 1000 / 1000) < ${to}` : ''}
        group by receiver_account_id
        order by count DESC
    `);
  }

  async findTransactions(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<Transaction[]> {
    let queryBuilder = this.getTransactionIntervalQueryBuilder(
      { contract: contractId },
      from,
      to,
    );

    queryBuilder = queryBuilder
      .where('transaction.contractId = :contractId', { contractId })
      .orderBy('transaction.block_timestamp', 'ASC');

    return queryBuilder.getMany();
  }

  async getFirstTransaction(contractId: string): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: {
        contractId,
      },
      order: { blockTimestamp: 'ASC' },
    });
  }

  private getTotalCountQuery(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
    type?: TransactionType,
  ): SelectQueryBuilder<Transaction> {
    const { from, to } = metricQuery || {};

    const queryBuilder = this.getTransactionIntervalQueryBuilder(
      context,
      from,
      to,
    );

    return queryBuilder
      .select(`count(receiver_account_id)::int`)
      .andWhere('type = :type', { type });
  }

  private getContractActivityCountQuery(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    const { CreateDao } = TransactionType;
    const { dao } = context as DaoContractContext;
    const { from, to } = metricQuery || {};

    const queryBuilder = this.getTransactionIntervalQueryBuilder(
      context,
      from,
      to,
    );

    // TODO: distinct???
    return queryBuilder
      .select(
        `count(${dao ? '' : 'distinct'} receiver_account_id)::int as count`,
      )
      .andWhere('type != :type', { type: CreateDao });
  }

  private getTransactionIntervalQueryBuilder(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): SelectQueryBuilder<Transaction> {
    const { contract, dao } = context as DaoContractContext;

    const qb = this.transactionRepository.createQueryBuilder();

    qb.where('contract_id = :contract', { contract });

    if (dao) {
      qb.andWhere('receiver_account_id = :dao', { dao });
    }

    if (from) {
      qb.andWhere('(block_timestamp / 1000 / 1000) > :from', { from });
    }

    if (to) {
      qb.andWhere('(block_timestamp / 1000 / 1000) < :to', { to });
    }

    return qb;
  }

  private addDailySelection(
    qb: SelectQueryBuilder<Transaction>,
  ): SelectQueryBuilder<Transaction> {
    return qb
      .addSelect(
        `date_trunc('day', to_timestamp(block_timestamp / 1000 / 1000 / 1000)) as day`,
      )
      .groupBy('day')
      .orderBy('day', 'ASC');
  }
}

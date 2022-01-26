import { Connection, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import {
  ContractContext,
  DailyCountDto,
  DaoContractContext,
  Metric,
  MetricQuery,
  millisToNanos,
  Transaction,
  TransactionType,
  ActivityInterval,
  IntervalMetricQuery,
} from '@dao-stats/common';

import { TransactionLeaderboardDto } from './dto/transaction-leaderboard.dto';

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

  async firstTransaction(contractId: string): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: {
        contractId,
      },
      order: { blockTimestamp: 'ASC' },
    });
  }

  lastTransaction(contractId: string): Promise<Transaction> {
    return this.transactionRepository.findOne({
      where: { contractId },
      order: { blockTimestamp: 'DESC' },
    });
  }

  async getTotalCountDaily(
    context: DaoContractContext | ContractContext,
    txType: TransactionType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    const { contractId, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const query = `
        with data as (
          select
            date_trunc('day', to_timestamp(block_timestamp / 1e9)) as day,
            count(1)
          from transactions
          where contract_id = '${contractId}' and type = '${txType}'
          ${dao ? `and receiver_account_id = '${dao}'` : ''}
          group by 1
        )
        
        select
          day,
          sum(count) over (order by day asc rows between unbounded preceding and current row)::int as count
        from data
        ${from ? `where day >= to_timestamp(${from})` : ''}
        ${to ? `${from ? ' and' : ' where'} day <= to_timestamp(${to})` : ''}
    `;

    return this.connection.query(query);
  }

  async getContractActivityCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Metric> {
    return this.getContractActivityCountQuery(context, metricQuery).getRawOne();
  }

  async getContractActivityCountHistory(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
    interval?: ActivityInterval,
  ): Promise<DailyCountDto[]> {
    let queryBuilder = this.getContractActivityCountQuery(context, metricQuery);
    queryBuilder = this.addIntervalSelection(queryBuilder, interval);

    return queryBuilder.execute();
  }

  async getUsersTotalCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Metric> {
    return this.getUsersTotalQueryBuilder(context, metricQuery).getRawOne();
  }

  async getUsersTotalCountHistory(
    context: DaoContractContext | ContractContext,
    metricQuery?: IntervalMetricQuery,
  ): Promise<DailyCountDto[]> {
    const { interval } = metricQuery;

    let queryBuilder = this.getUsersTotalQueryBuilder(context, metricQuery);
    queryBuilder = this.addIntervalSelection(queryBuilder, interval);

    return queryBuilder.execute();
  }

  async getInteractionsCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Metric> {
    return this.getInteractionsCountQueryBuilder(
      context,
      metricQuery,
    ).getRawOne();
  }

  async getInteractionsCountDaily(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    let queryBuilder = this.getInteractionsCountQueryBuilder(
      context,
      metricQuery,
    );
    queryBuilder = this.addDailySelection(queryBuilder);

    return queryBuilder.execute();
  }

  async getDaoUsers(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<TransactionLeaderboardDto[]> {
    return await this.getUsersTotalQueryBuilder(context, metricQuery)
      .addSelect('receiver_account_id')
      .groupBy('receiver_account_id')
      .execute();
  }

  async getDaoInteractions(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<TransactionLeaderboardDto[]> {
    return await this.getInteractionsCountQueryBuilder(context, metricQuery)
      .addSelect('receiver_account_id')
      .groupBy('receiver_account_id')
      .execute();
  }

  async getActivityLeaderboard(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    let queryBuilder = this.getActivityIntervalQueryBuilder(
      context,
      metricQuery,
    )
      .select(`count(receiver_account_id)::int as count`)
      .addSelect('receiver_account_id');

    if (daily) {
      queryBuilder = this.addDailySelection(queryBuilder);
    } else {
      queryBuilder.limit(10);
    }

    return queryBuilder
      .addGroupBy('receiver_account_id')
      .addOrderBy('count', 'DESC')
      .execute();
  }

  private getContractActivityCountQuery(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    const { dao } = context as DaoContractContext;

    return this.getActivityIntervalQueryBuilder(context, metricQuery).select(
      `count(${dao ? '' : 'distinct'} receiver_account_id)::int as count`,
    );
  }

  private getInteractionsCountQueryBuilder(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    return this.getActivityIntervalQueryBuilder(context, metricQuery).select(
      'count(receiver_account_id)::int as count',
    );
  }

  private getUsersTotalQueryBuilder(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    return this.getIntervalQueryBuilder(context, metricQuery)
      .select('count(distinct signer_account_id)::int')
      .addOrderBy('count', 'DESC');
  }

  private getActivityIntervalQueryBuilder(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    return this.getIntervalQueryBuilder(context, metricQuery).andWhere(
      'type != :type',
      {
        type: TransactionType.CreateDao,
      },
    );
  }

  private getIntervalQueryBuilder(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    const { contract, dao } = context as DaoContractContext;
    const { contractId, contractName } = contract;
    const { from, to } = metricQuery || {};

    const qb = this.transactionRepository.createQueryBuilder();

    qb.where('contract_id = :contractId', { contractId });

    if (dao) {
      qb.andWhere('receiver_account_id = :dao', { dao });
    } else {
      qb.andWhere('receiver_account_id like :id', { id: `%.${contractName}` });
    }

    if (from) {
      qb.andWhere('block_timestamp >= :from', {
        from: String(millisToNanos(from)),
      });
    }

    if (to) {
      qb.andWhere('block_timestamp <= :to', { to: String(millisToNanos(to)) });
    }

    return qb;
  }

  private addDailySelection(
    qb: SelectQueryBuilder<Transaction>,
  ): SelectQueryBuilder<Transaction> {
    return qb
      .addSelect(
        `date_trunc('day', to_timestamp(block_timestamp / 1e9)) as day`,
      )
      .groupBy('day')
      .orderBy('day', 'ASC');
  }

  private addIntervalSelection(
    qb: SelectQueryBuilder<Transaction>,
    interval: ActivityInterval,
  ): SelectQueryBuilder<Transaction> {
    return qb
      .addSelect(
        `date_trunc('${interval}', to_timestamp(block_timestamp / 1e9) + '1 ${interval}'::interval) as day`,
      )
      .groupBy('day')
      .orderBy('day', 'ASC');
  }
}

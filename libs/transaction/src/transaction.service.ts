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
          ${from ? `and block_timestamp >= ${millisToNanos(from)}` : ''}
          ${to ? `and block_timestamp <= ${millisToNanos(to)}` : ''}
          group by 1
        )
        
        select
          day,
          sum(count) over (order by day asc rows between unbounded preceding and current row)::int as count
        from data
    `;

    return this.connection.query(query);
  }

  async getContractActivityCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Metric> {
    return this.getContractActivityCountQuery(context, metricQuery).getRawOne();
  }

  async getContractActivityCountDaily(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    let queryBuilder = this.getContractActivityCountQuery(context, metricQuery);
    queryBuilder = this.addDailySelection(queryBuilder);

    return queryBuilder.execute();
  }

  async getUsersTotalCount(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): Promise<Metric> {
    return this.getUsersTotalQueryBuilder(context, metricQuery).getRawOne();
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
      { type: TransactionType.CreateDao },
    );
  }

  private getIntervalQueryBuilder(
    context: DaoContractContext | ContractContext,
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery || {};

    const qb = this.transactionRepository.createQueryBuilder();

    qb.where('contract_id = :contract', { contract });

    if (dao) {
      qb.andWhere('receiver_account_id = :dao', { dao });
    }

    if (from) {
      qb.andWhere(`block_timestamp >= ${millisToNanos(from)}`);
    }

    if (to) {
      qb.andWhere(`block_timestamp <= ${millisToNanos(to)}`);
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

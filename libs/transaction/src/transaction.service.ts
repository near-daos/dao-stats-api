import { Connection, Repository, SelectQueryBuilder } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';

import {
  DailyCountDto,
  Metric,
  MetricQuery,
  millisToNanos,
  Transaction,
  TransactionType,
} from '@dao-stats/common';
import { TransactionLeaderboardDto } from './dto/transaction-leaderboard.dto';
import { ContractContextService } from 'apps/api/src/context/contract-context.service';

@Injectable()
export class TransactionService extends ContractContextService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectConnection()
    private connection: Connection,
  ) {
    super();
  }

  // TODO: split aggregation/retrieval interactions due to ContractContext injection
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
    txType: TransactionType,
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    const { contract, dao } = this.getContext();
    const { contractId } = contract;
    const { from, to } = metricQuery;

    const query = `
        with data as (
          select
            date_trunc('day', to_timestamp(block_timestamp / 1000 / 1000 / 1000)) as day,
            count(1)
          from transactions
          where contract_id = '${contractId}' and type = '${txType}'
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

  async getContractActivityCount(metricQuery?: MetricQuery): Promise<Metric> {
    return this.getContractActivityCountQuery(metricQuery).getRawOne();
  }

  async getContractActivityCountDaily(
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    let queryBuilder = this.getContractActivityCountQuery(metricQuery);
    queryBuilder = this.addDailySelection(queryBuilder);

    return queryBuilder.execute();
  }

  async getUsersTotalCount(metricQuery?: MetricQuery): Promise<Metric> {
    return this.getUsersTotalQueryBuilder(metricQuery).getRawOne();
  }

  async getInteractionsCount(metricQuery?: MetricQuery): Promise<Metric> {
    return this.getInteractionsCountQueryBuilder(metricQuery).getRawOne();
  }

  async getInteractionsCountDaily(
    metricQuery?: MetricQuery,
  ): Promise<DailyCountDto[]> {
    let queryBuilder = this.getInteractionsCountQueryBuilder(metricQuery);
    queryBuilder = this.addDailySelection(queryBuilder);

    return queryBuilder.execute();
  }

  async getDaoUsers(
    metricQuery?: MetricQuery,
  ): Promise<TransactionLeaderboardDto[]> {
    return await this.getUsersTotalQueryBuilder(metricQuery)
      .addSelect('receiver_account_id')
      .groupBy('receiver_account_id')
      .execute();
  }

  async getDaoInteractions(
    metricQuery?: MetricQuery,
  ): Promise<TransactionLeaderboardDto[]> {
    return await this.getInteractionsCountQueryBuilder(metricQuery)
      .addSelect('receiver_account_id')
      .groupBy('receiver_account_id')
      .execute();
  }

  async getActivityLeaderboard(
    metricQuery?: MetricQuery,
    daily?: boolean,
  ): Promise<any[]> {
    let queryBuilder = this.getActivityIntervalQueryBuilder(metricQuery)
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
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    const { dao } = this.getContext();

    return this.getActivityIntervalQueryBuilder(metricQuery).select(
      `count(${dao ? '' : 'distinct'} receiver_account_id)::int as count`,
    );
  }

  private getInteractionsCountQueryBuilder(
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    return this.getActivityIntervalQueryBuilder(metricQuery).select(
      'count(receiver_account_id)::int as count',
    );
  }

  private getUsersTotalQueryBuilder(
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    return this.getIntervalQueryBuilder(metricQuery)
      .select('count(distinct signer_account_id)::int')
      .addOrderBy('count', 'DESC');
  }

  private getActivityIntervalQueryBuilder(
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    return this.getIntervalQueryBuilder(metricQuery).andWhere('type != :type', {
      type: TransactionType.CreateDao,
    });
  }

  private getIntervalQueryBuilder(
    metricQuery?: MetricQuery,
  ): SelectQueryBuilder<Transaction> {
    const { contract, dao } = this.getContext();
    const { contractId } = contract;
    const { from, to } = metricQuery || {};

    const qb = this.transactionRepository.createQueryBuilder();

    qb.where('contract_id = :contractId', { contractId });

    if (dao) {
      qb.andWhere('receiver_account_id = :dao', { dao });
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
        `date_trunc('day', to_timestamp(block_timestamp / 1000 / 1000 / 1000)) as day`,
      )
      .groupBy('day')
      .orderBy('day', 'ASC');
  }
}

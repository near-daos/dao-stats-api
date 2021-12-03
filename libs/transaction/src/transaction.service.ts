import { Transaction } from '@dao-stats/common/entities/transaction.entity';
import { TransactionType } from '@dao-stats/common/types/transaction-type';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, SelectQueryBuilder } from 'typeorm';
import PromisePool from '@supercharge/promise-pool';
import moment from 'moment';
import { millisToNanos } from '@dao-stats/astro/utils';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';

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

  async getContractTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    let queryBuilder = this.getTransactionIntervalQueryBuilder(
      this.transactionRepository.createQueryBuilder('transaction'),
      from,
      to,
    );

    queryBuilder = queryBuilder
      .where('transaction.contractId = :contract', { contract })
      .andWhere('transaction.type = :type', {
        type: TransactionType.CreateDao,
      });

    queryBuilder = dao
      ? queryBuilder.andWhere('transaction.receiver_account_id = :dao', { dao })
      : queryBuilder;

    return queryBuilder.getCount();
  }

  async getContractActivityTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;
    const { CreateDao } = TransactionType;
    const query = `
        select count(${
          dao ? '' : 'distinct'
        } receiver_account_id) from transactions 
        where contract_id = '${contract}' and type != '${CreateDao}'
        ${dao ? `and receiver_account_id = '${dao}'` : ''}
        ${from ? `and block_timestamp > ${from}` : ''}
        ${to ? `and block_timestamp < ${to}` : ''}
    `;

    const qr = await this.connection.query(query);

    return qr?.[0]?.count;
  }

  async getDaoCountHistory(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<MetricResponse> {
    const { CreateDao } = TransactionType;
    const days = this.getDailyIntervals(from, to || moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          `
            select count(receiver_account_id) from transactions 
            where contract_id = '${contractId}' and type = '${CreateDao}'
            ${end ? `and block_timestamp < ${end}` : ''}
          `,
        );

        return { ...qr?.[0], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    return {
      metrics: byDays
        .flat()
        .sort((a, b) => a.end - b.end)
        .map(({ end: timestamp, count }) => ({
          timestamp,
          count,
        })),
    };
  }

  async getDaoActivityHistory(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<MetricResponse> {
    const days = this.getDailyIntervals(from, to || moment().valueOf());

    const { CreateDao } = TransactionType;

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          `
            select count(distinct receiver_account_id) from transactions 
            where contract_id = '${contractId}' and type != '${CreateDao}'
            ${start ? `and block_timestamp > ${start}` : ''}
            ${end ? `and block_timestamp < ${end}` : ''}
          `,
        );

        return { ...qr?.[0], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    return {
      metrics: byDays
        .flat()
        .sort((a, b) => a.end - b.end)
        .map(({ end: timestamp, count }) => ({
          timestamp,
          count,
        })),
    };
  }

  async getDaoActivityLeaderboard(
    contractId: string,
  ): Promise<LeaderboardMetricResponse> {
    const { CreateDao } = TransactionType;

    const weekAgo = moment().subtract(7, 'days');
    const days = this.getDailyIntervals(weekAgo.valueOf(), moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          `
            select count(receiver_account_id), receiver_account_id from transactions 
            where contract_id = '${contractId}' and type != '${CreateDao}'
            
            ${start ? `and block_timestamp > ${start}` : ''}
            ${end ? `and block_timestamp < ${end}` : ''}
            group by receiver_account_id
          `,
        );

        return { ...qr?.[0], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoActivity = await this.connection.query(
      this.getTotalActivityQuery(
        contractId,
        null,
        millisToNanos(dayAgo.valueOf()),
      ),
    );

    const totalActivity = await this.connection.query(
      this.getTotalActivityQuery(
        contractId,
        null,
        millisToNanos(moment().valueOf()),
      ),
    );

    const metrics = totalActivity.map(
      ({ receiver_account_id: dao, receiver_count: count }) => {
        const dayAgoCount =
          dayAgoActivity.find(
            ({ receiver_account_id }) => receiver_account_id === dao,
          )?.receiver_count || 0;

        return {
          dao,
          activity: {
            count,
            growth: Math.floor(
              ((count - dayAgoCount) / (dayAgoCount || 1)) * 100,
            ),
          },
          overview: days.map(({ end: timestamp }) => ({
            timestamp,
            count:
              byDays.find(
                ({ receiver_account_id, end }) =>
                  receiver_account_id === dao && end === timestamp,
              )?.count || 0,
          })),
        };
      },
    );

    return {
      metrics,
    };
  }

  async getUsersTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    const qr = await this.connection.query(
      `
        select count(distinct signer_account_id) from transactions 
        where contract_id = '${contract}'
        ${dao ? `and receiver_account_id = '${dao}'` : ''}
        ${from ? `and block_timestamp > ${from}` : ''}
        ${to ? `and block_timestamp < ${to}` : ''}
      `,
    );

    return qr?.[0]?.count;
  }

  async getUsersCountHistory(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<MetricResponse> {
    const { contract, dao } = context as DaoContractContext;
    const days = this.getDailyIntervals(from, to || moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          `
            select count(distinct signer_account_id) from transactions 
            where contract_id = '${contract}'
            ${dao ? `and receiver_account_id = '${dao}'` : ''}
            ${end ? `and block_timestamp < ${end}` : ''}
          `,
        );

        return { ...qr?.[0], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    return {
      metrics: byDays
        .flat()
        .sort((a, b) => a.end - b.end)
        .map(({ end: timestamp, count }) => ({
          timestamp,
          count,
        })),
    };
  }

  async getUsersLeaderboard(
    contractId: string,
  ): Promise<LeaderboardMetricResponse> {
    const { CreateDao } = TransactionType;

    const weekAgo = moment().subtract(7, 'days');
    const days = this.getDailyIntervals(weekAgo.valueOf(), moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          `
            select count(distinct signer_account_id), receiver_account_id from transactions 
            where contract_id = '${contractId}' and type != '${CreateDao}'
            
            ${start ? `and block_timestamp > ${start}` : ''}
            ${end ? `and block_timestamp < ${end}` : ''}
            group by receiver_account_id
          `,
        );

        return { ...qr?.[0], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoActivity = await this.connection.query(
      this.getUsersActivityQuery(
        contractId,
        null,
        millisToNanos(dayAgo.valueOf()),
      ),
    );

    const totalActivity = await this.connection.query(
      this.getUsersActivityQuery(
        contractId,
        null,
        millisToNanos(moment().valueOf()),
      ),
    );

    const metrics = totalActivity.map(
      ({ receiver_account_id: dao, signer_count: count }) => {
        const dayAgoCount =
          dayAgoActivity.find(
            ({ receiver_account_id }) => receiver_account_id === dao,
          )?.signer_count || 0;

        return {
          dao,
          activity: {
            count,
            growth: Math.floor(
              ((count - dayAgoCount) / (dayAgoCount || 1)) * 100,
            ),
          },
          overview: days.map(({ end: timestamp }) => ({
            timestamp,
            count:
              byDays.find(
                ({ receiver_account_id, end }) =>
                  receiver_account_id === dao && end === timestamp,
              )?.count || 0,
          })),
        };
      },
    );

    return {
      metrics,
    };
  }

  async getProposalsTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    return this.getProposalQueryBuilder(context, from, to).getCount();
  }

  async getProposalsCountHistory(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<MetricResponse> {
    const days = this.getDailyIntervals(from, to || moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const count = await this.getProposalQueryBuilder(
          context,
          null,
          end,
        ).getCount();

        return { count, start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    return {
      metrics: byDays
        .flat()
        .sort((a, b) => a.end - b.end)
        .map(({ end: timestamp, count }) => ({
          timestamp,
          count,
        })),
    };
  }

  async getTransactionTotalCount(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context as DaoContractContext;

    const qr = await this.connection.query(
      `
        select count(transaction_hash) from transactions 
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
  ): Promise<LeaderboardMetricResponse> {
    const today = moment();
    const weekAgo = moment().subtract(7, 'days');
    const days = this.getDailyIntervals(weekAgo.valueOf(), today.valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          this.getProposalsLeaderboardQuery(contractId, null, end),
        );

        return { proposalsCount: [...qr], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoProposalsCount = await this.connection.query(
      this.getProposalsLeaderboardQuery(
        contractId,
        null,
        millisToNanos(dayAgo.valueOf()),
      ),
    );

    const totalProposalsCount = await this.connection.query(
      this.getProposalsLeaderboardQuery(
        contractId,
        null,
        millisToNanos(today.valueOf()),
      ),
    );

    const metrics = totalProposalsCount.map(
      ({ receiver_account_id: dao, signer_count: count }) => {
        const dayAgoCount =
          dayAgoProposalsCount.find(
            ({ receiver_account_id }) => receiver_account_id === dao,
          )?.signer_count || 0;

        return {
          dao,
          activity: {
            count,
            growth: Math.floor(
              ((count - dayAgoCount) / (dayAgoCount || 1)) * 100,
            ),
          },
          overview: days.map(({ end: timestamp }) => ({
            timestamp,
            count:
              byDays
                .find(({ end }) => end === timestamp)
                ?.proposalsCount?.find(
                  ({ receiver_account_id }) => receiver_account_id === dao,
                )?.signer_count || 0,
          })),
        };
      },
    );

    return {
      metrics,
    };
  }

  async findTransactions(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<Transaction[]> {
    let queryBuilder = this.getTransactionIntervalQueryBuilder(
      this.transactionRepository.createQueryBuilder('transaction'),
      from,
      to,
    );

    queryBuilder = queryBuilder
      .where('transaction.contractId = :contractId', { contractId })
      .orderBy('transaction.block_timestamp', 'ASC');

    return queryBuilder.getMany();
  }

  private getDailyIntervals(
    from: number,
    to: number,
  ): { start: number; end: number }[] {
    let timestamp = from;
    const days = [];
    while (true) {
      const dayStart = timestamp;
      const dayEnd = moment(timestamp).add(1, 'days').valueOf();

      if (timestamp >= to) {
        break;
      }

      days.push({
        start: millisToNanos(dayStart),
        end: millisToNanos(dayEnd),
      });

      timestamp = dayEnd;
    }

    return days;
  }

  private getTotalActivityQuery(
    contractId: string,
    from?: number,
    to?: number,
  ): string {
    const { CreateDao } = TransactionType;

    return `
      select count(receiver_account_id) as receiver_count, receiver_account_id from transactions 
      where contract_id = '${contractId}' and type != '${CreateDao}'
      ${from ? `and block_timestamp > ${from}` : ''}
      ${to ? `and block_timestamp < ${to}` : ''}
      group by receiver_account_id
      order by receiver_count DESC
      limit 10
    `;
  }

  private getUsersActivityQuery(
    contractId: string,
    from?: number,
    to?: number,
  ): string {
    const { CreateDao } = TransactionType;

    return `
      select count(distinct signer_account_id) as signer_count, receiver_account_id from transactions 
      where contract_id = '${contractId}' and type != '${CreateDao}'
      ${from ? `and block_timestamp > ${from}` : ''}
      ${to ? `and block_timestamp < ${to}` : ''}
      group by receiver_account_id
      order by signer_count DESC
      limit 10
    `;
  }

  private getProposalsLeaderboardQuery(
    contractId: string,
    from?: number,
    to?: number,
  ): string {
    const { AddProposal } = TransactionType;

    return `
        select count(signer_account_id) as signer_count, receiver_account_id from transactions 
        where contract_id = '${contractId}' and type = '${AddProposal}'
        ${from ? `and block_timestamp > ${from}` : ''}
        ${to ? `and block_timestamp < ${to}` : ''}
        group by receiver_account_id
        order by signer_count DESC
    `;
  }

  private getProposalQueryBuilder(
    context: DaoContractContext | ContractContext,
    from?: number,
    to?: number,
  ): SelectQueryBuilder<Transaction> {
    const { contract, dao } = context as DaoContractContext;

    let queryBuilder = this.getTransactionIntervalQueryBuilder(
      this.transactionRepository.createQueryBuilder('transaction'),
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

    return queryBuilder;
  }

  private getTransactionIntervalQueryBuilder(
    qb: SelectQueryBuilder<Transaction>,
    from?: number,
    to?: number,
  ): SelectQueryBuilder<Transaction> {
    qb = from
      ? qb.andWhere('transaction.block_timestamp > :from', {
          from,
        })
      : qb;

    qb = to
      ? qb.andWhere('transaction.block_timestamp < :to', {
          to,
        })
      : qb;

    return qb;
  }
}

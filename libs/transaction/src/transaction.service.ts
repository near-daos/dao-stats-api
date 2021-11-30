import { Transaction } from '@dao-stats/common/entities/transaction.entity';
import { TransactionType } from '@dao-stats/common/types/transaction-type';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { GeneralDaoResponse } from 'apps/api/src/general/dto/general-dao.dto';
import { Connection, Repository } from 'typeorm';
import PromisePool from '@supercharge/promise-pool';
import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import { GeneralLeaderboardResponse } from 'apps/api/src/general/dto/general-leaderboard.dto';
import { DaoTenantContext } from '@dao-stats/common/dto/dao-tenant-context.dto';

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
    context: DaoTenantContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context;

    let queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.contractId = :contract', { contract })
      .andWhere('transaction.type = :type', {
        type: TransactionType.CreateDao,
      });

    queryBuilder = dao
      ? queryBuilder.andWhere('transaction.receiver_account_id = :dao', { dao })
      : queryBuilder;

    queryBuilder = from
      ? queryBuilder.andWhere('transaction.block_timestamp > :from', {
          from,
        })
      : queryBuilder;

    queryBuilder = to
      ? queryBuilder.andWhere('transaction.block_timestamp < :to', {
          to,
        })
      : queryBuilder;

    return queryBuilder.getCount();
  }

  async getContractActivityTotalCount(
    context: DaoTenantContext,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { contract, dao } = context;
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
  ): Promise<GeneralDaoResponse> {
    const { CreateDao } = TransactionType;
    const days = this.getDailyIntervals(from, new Date().getTime()).map(
      (day) => ({
        ...day,
        start: from,
      }),
    );

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
      metrics: byDays.flat().sort((a, b) => a.end - b.end),
    };
  }

  async getDaoActivityHistory(
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<GeneralDaoResponse> {
    const days = this.getDailyIntervals(from, new Date().getTime());

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
      metrics: byDays.flat().sort((a, b) => a.end - b.end),
    };
  }

  async getDaoActivityLeaderboard(
    contractId: string,
  ): Promise<GeneralLeaderboardResponse> {
    const { CreateDao } = TransactionType;

    const today = new Date();
    const weekAgo = daysFromDate(today, -7);
    const days = this.getDailyIntervals(
      weekAgo.getTime(),
      new Date().getTime(),
    );

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

    const weekAgoActivity = await this.connection.query(
      this.getTotalActivityQuery(
        contractId,
        null,
        millisToNanos(weekAgo.getTime()),
      ),
    );

    const totalActivity = await this.connection.query(
      this.getTotalActivityQuery(
        contractId,
        null,
        millisToNanos(today.getTime()),
      ),
    );

    const metrics = totalActivity.map(
      ({ receiver_account_id: dao, receiver_count: count }) => {
        const weekAgoCount = weekAgoActivity.find(
          ({ receiver_account_id }) => receiver_account_id === dao,
        )?.receiver_count;

        return {
          dao,
          activity: {
            count,
            growth: Math.ceil(((count - weekAgoCount) / weekAgoCount) * 100),
          },
          overview: days.map((day) => ({
            ...day,
            count: byDays.find(
              ({ receiver_account_id, start }) =>
                receiver_account_id === dao && start === day.start,
            )?.count,
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
    let queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.contractId = :contractId', { contractId })
      .orderBy('transaction.block_timestamp', 'ASC');

    queryBuilder = from
      ? queryBuilder.andWhere('transaction.block_timestamp > :from', {
          from,
        })
      : queryBuilder;

    queryBuilder = to
      ? queryBuilder.andWhere('transaction.block_timestamp < :to', {
          to,
        })
      : queryBuilder;

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
      let dayEnd = daysFromDate(new Date(timestamp), 1).getTime();

      days.push({
        start: millisToNanos(dayStart),
        end: millisToNanos(dayEnd),
      });

      if (timestamp > to) {
        break;
      }

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
}

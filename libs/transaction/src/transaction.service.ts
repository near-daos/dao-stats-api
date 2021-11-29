import { Transaction } from '@dao-stats/common/entities/transaction.entity';
import { TransactionType } from '@dao-stats/common/types/transaction-type';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { GeneralDaoResponse } from 'apps/api/src/general/dto/general-dao.dto';
import { Connection, Repository } from 'typeorm';
import PromisePool from '@supercharge/promise-pool';
import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';

@Injectable()
export class TransactionService {
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
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<number> {
    let queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.contractId = :contractId', { contractId })
      .andWhere('transaction.type = :type', {
        type: TransactionType.CreateDao,
      });

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
    contractId: string,
    from?: number,
    to?: number,
  ): Promise<number> {
    const { CreateDao } = TransactionType;
    const query = `
        select count(distinct receiver_account_id) from transactions 
        where contract_id = '${contractId}' and type != '${CreateDao}'
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
    let timestamp = from;
    const endDate = new Date().getTime();
    const days = [];
    while (true) {
      let dayEnd = daysFromDate(new Date(timestamp), 1).getTime();

      days.push({
        start: millisToNanos(from),
        end: millisToNanos(dayEnd),
      });

      if (timestamp > endDate) {
        break;
      }

      timestamp = dayEnd;
    }

    const { CreateDao } = TransactionType;

    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.connection.query(
          `
            select count(distinct receiver_account_id) from transactions 
            where contract_id = '${contractId}' and type != '${CreateDao}'
            ${end ? `and block_timestamp < ${end}` : ''}
          `,
        );

        return { ...qr?.[0], start, end };
      });

    return {
      metrics: byDays.flat().sort((a, b) => a.end - b.end),
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
}

import { Transaction } from '@dao-stats/common/entities/transaction.entity';
import { TransactionType } from '@dao-stats/common/types/transaction-type';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';

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

  findTransactions(
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

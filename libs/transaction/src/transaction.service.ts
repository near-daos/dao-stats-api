import { Transaction } from '@dao-stats/common/entities/transaction.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
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
}

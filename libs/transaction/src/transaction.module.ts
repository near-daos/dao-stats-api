import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract, Receipt, ReceiptAction } from '@dao-stats/common/entities';
import { Transaction } from '@dao-stats/common/entities/transaction.entity';

import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Receipt, ReceiptAction, Contract]),
  ],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}

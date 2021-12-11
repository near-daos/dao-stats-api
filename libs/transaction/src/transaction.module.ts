import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  Receipt,
  ReceiptAction,
  Transaction,
} from '@dao-stats/common';

import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Receipt, ReceiptAction, Contract]),
  ],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}

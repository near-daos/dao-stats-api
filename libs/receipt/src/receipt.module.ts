import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  ContractModule,
  Receipt,
  ReceiptAction,
} from '@dao-stats/common';

import { ReceiptActionService } from './receipt-action.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt, ReceiptAction, Contract]),
    ContractModule,
  ],
  providers: [ReceiptActionService],
  exports: [ReceiptActionService],
})
export class ReceiptModule {}

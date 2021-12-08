import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract, Receipt, ReceiptAction } from '@dao-stats/common';

import { ReceiptService } from './receipt.service';
import { ContractModule } from 'apps/api/src/contract/contract.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt, ReceiptAction, Contract]),
    ContractModule,
  ],
  providers: [ReceiptService],
  exports: [ReceiptService],
})
export class ReceiptModule {}
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Contract } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';
import { ReceiptModule } from 'libs/receipt/src';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    TransactionModule,
    ReceiptModule,
    ContractModule,
  ],
  providers: [FlowService],
  controllers: [FlowController],
})
export class FlowModule {}

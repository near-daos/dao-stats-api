import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { Contract } from '@dao-stats/common';
import { ReceiptModule } from '@dao-stats/receipt';
import { TransactionModule } from '@dao-stats/transaction';

import { FlowController } from './flow.controller';
import { FlowService } from './flow.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    TransactionModule,
    ReceiptModule,
  ],
  providers: [FlowService],
  controllers: [FlowController],
})
export class FlowModule {}

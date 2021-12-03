import { CacheModule, Module } from '@nestjs/common';

import { FlowController } from './flow.controller';
import { CacheConfigService } from '@dao-stats/config/cache';
import { TransactionModule } from 'libs/transaction/src';
import { FlowService } from './flow.service';
import { Contract } from '@dao-stats/common/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    TransactionModule,
  ],
  providers: [FlowService],
  controllers: [FlowController],
})
export class FlowModule {}

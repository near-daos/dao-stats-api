import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import {
  ContractModule,
  DaoStatsHistoryModule,
  DaoStatsModule,
} from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MetricService } from '../common/metric.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TransactionModule,
    DaoStatsModule,
    DaoStatsHistoryModule,
    ContractModule,
  ],
  providers: [UsersService, MetricService],
  controllers: [UsersController],
})
export class UsersModule {}

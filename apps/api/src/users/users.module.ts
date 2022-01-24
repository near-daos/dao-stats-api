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
import { MetricModule } from '../common/metric.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TransactionModule,
    DaoStatsModule,
    DaoStatsHistoryModule,
    ContractModule,
    MetricModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}

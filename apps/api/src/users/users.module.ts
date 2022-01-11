import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { DaoStatsHistoryModule, DaoStatsModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ContractModule } from '../contract/contract.module';
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

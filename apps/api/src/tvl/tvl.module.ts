import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import {
  CoinPriceHistoryModule,
  ContractModule,
  DaoStatsHistoryModule,
  DaoStatsModule,
} from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TvlController } from './tvl.controller';
import { TvlService } from './tvl.service';
import { MetricService } from '../common/metric.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    DaoStatsModule,
    DaoStatsHistoryModule,
    TransactionModule,
    ContractModule,
    CoinPriceHistoryModule,
  ],
  providers: [TvlService, MetricService],
  controllers: [TvlController],
})
export class TvlModule {}

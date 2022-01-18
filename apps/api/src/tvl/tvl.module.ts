import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { DaoStatsHistoryModule, DaoStatsModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TvlController } from './tvl.controller';
import { TvlService } from './tvl.service';
import { ContractModule } from '../contract/contract.module';
import { MetricService } from '../common/metric.service';
import { CoinPriceHistoryModule } from '@dao-stats/common/coin-price-history.module';

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

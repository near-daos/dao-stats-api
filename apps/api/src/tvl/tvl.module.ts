import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { DaoStatsHistoryModule, DaoStatsModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TvlController } from './tvl.controller';
import { TvlService } from './tvl.service';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    DaoStatsModule,
    DaoStatsHistoryModule,
    TransactionModule,
    ContractModule,
  ],
  providers: [TvlService],
  controllers: [TvlController],
})
export class TvlModule {}

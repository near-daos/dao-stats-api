import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import {
  ContractModule,
  DaoStatsModule,
  DaoStatsHistoryModule,
} from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
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
  providers: [GeneralService, MetricService],
  controllers: [GeneralController],
})
export class GeneralModule {}

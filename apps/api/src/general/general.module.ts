import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule, DaoStatsHistoryModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
import { MetricModule } from '../common/metric.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TransactionModule,
    DaoStatsHistoryModule,
    ContractModule,
    MetricModule,
  ],
  providers: [GeneralService],
  controllers: [GeneralController],
})
export class GeneralModule {}

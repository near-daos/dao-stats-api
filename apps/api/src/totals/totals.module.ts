import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TotalsController } from './totals.controller';
import { MetricModule } from '../common/metric.module';
import metrics from './metrics';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TransactionModule,
    ContractModule,
    MetricModule,
  ],
  providers: [...metrics],
  controllers: [TotalsController],
})
export class TotalsModule {}

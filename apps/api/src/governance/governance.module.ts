import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { DaoStatsModule, DaoStatsHistoryModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { ContractModule } from '../contract/contract.module';
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
  ],
  providers: [GovernanceService, MetricService],
  controllers: [GovernanceController],
})
export class GovernanceModule {}

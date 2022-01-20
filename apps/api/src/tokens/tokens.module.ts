import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import {
  ContractModule,
  DaoStatsHistoryModule,
  DaoStatsModule,
} from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
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
  providers: [TokensService, MetricService],
  controllers: [TokensController],
})
export class TokensModule {}

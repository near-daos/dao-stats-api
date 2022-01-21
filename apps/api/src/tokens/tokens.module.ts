import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { MetricModule } from '../common/metric.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TransactionModule,
    ContractModule,
    MetricModule,
  ],
  providers: [TokensService],
  controllers: [TokensController],
})
export class TokensModule {}

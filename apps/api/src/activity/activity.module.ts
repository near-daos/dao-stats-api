import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { ContractModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { ActivityController } from './activity.controller';
import metrics from './metrics';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TransactionModule,
    ContractModule,
  ],
  providers: [...metrics],
  controllers: [ActivityController],
})
export class ActivityModule {}

import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import { DaoStatsHistoryModule, DaoStatsModule } from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
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
  providers: [TokensService],
  controllers: [TokensController],
})
export class TokensModule {}

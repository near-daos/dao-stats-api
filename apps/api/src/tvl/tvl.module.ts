import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import {
  Contract,
  DaoStatsHistoryModule,
  DaoStatsModule,
} from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';

import { TvlController } from './tvl.controller';
import { TvlService } from './tvl.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    DaoStatsModule,
    DaoStatsHistoryModule,
    TransactionModule,
  ],
  providers: [TvlService],
  controllers: [TvlController],
})
export class TvlModule {}

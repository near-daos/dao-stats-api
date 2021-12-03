import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { CacheConfigService } from '@dao-stats/config/cache';
import {
  Contract,
  DAOStatsModule,
  DAOStatsHistoryModule,
} from '@dao-stats/common';
import { TransactionModule } from '@dao-stats/transaction';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([Contract]),
    TransactionModule,
    DAOStatsModule,
    DAOStatsHistoryModule,
  ],
  providers: [GeneralService],
  controllers: [GeneralController],
})
export class GeneralModule {}

import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule, Module } from '@nestjs/common';

import { GeneralController } from './general.controller';
import { CacheConfigService } from '@dao-stats/config/cache';
import { TransactionModule } from 'libs/transaction/src';
import { GeneralService } from './general.service';
import { Contract } from '@dao-stats/common/entities';
import { DAOStatsModule } from '@dao-stats/common/dao-stats.module';
import { DAOStatsHistoryModule } from '@dao-stats/common/dao-stats-history.module';

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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DaoStatsHistory } from './entities';
import { DaoStatsHistoryService } from './dao-stats-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([DaoStatsHistory])],
  providers: [DaoStatsHistoryService],
  exports: [DaoStatsHistoryService],
})
export class DaoStatsHistoryModule {}

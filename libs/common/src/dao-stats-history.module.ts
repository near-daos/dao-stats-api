import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DAOStatsHistory } from './entities';
import { DAOStatsHistoryService } from './dao-stats-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([DAOStatsHistory])],
  providers: [DAOStatsHistoryService],
  exports: [DAOStatsHistoryService],
})
export class DAOStatsHistoryModule {}

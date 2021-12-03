import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DaoStats } from './entities';
import { DaoStatsService } from './dao-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([DaoStats])],
  providers: [DaoStatsService],
  exports: [DaoStatsService],
})
export class DaoStatsModule {}

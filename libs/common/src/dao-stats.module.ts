import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DAOStats } from './entities';
import { DAOStatsService } from './dao-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([DAOStats])],
  providers: [DAOStatsService],
  exports: [DAOStatsService],
})
export class DAOStatsModule {}

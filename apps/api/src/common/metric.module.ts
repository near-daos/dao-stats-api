import { Module } from '@nestjs/common';

import { DaoStatsHistoryModule, DaoStatsModule } from '@dao-stats/common';
import { MetricService } from './metric.service';

@Module({
  imports: [DaoStatsModule, DaoStatsHistoryModule],
  providers: [MetricService],
  exports: [MetricService],
})
export class MetricModule {}

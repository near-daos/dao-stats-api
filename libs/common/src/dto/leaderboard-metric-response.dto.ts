import { ApiProperty } from '@nestjs/swagger';
import { LeaderboardMetric } from './leaderboard-metric.dto';

export class LeaderboardMetricResponse {
  @ApiProperty({ type: [LeaderboardMetric] })
  metrics: LeaderboardMetric[];
}

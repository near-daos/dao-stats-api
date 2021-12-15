import { LeaderboardMetric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class FlowLeaderboardMetricResponse {
  @ApiProperty({ type: [LeaderboardMetric] })
  incoming: LeaderboardMetric[];

  @ApiProperty({ type: [LeaderboardMetric] })
  outgoing: LeaderboardMetric[];
}

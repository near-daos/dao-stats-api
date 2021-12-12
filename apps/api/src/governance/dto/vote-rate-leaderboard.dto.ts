import { ApiProperty } from '@nestjs/swagger';
import { Metric, TotalMetric } from '@dao-stats/common';

export class VoteRateLeaderboard {
  @ApiProperty()
  dao: string;

  @ApiProperty()
  proposals: TotalMetric;

  @ApiProperty()
  approvedProposals: TotalMetric;

  @ApiProperty()
  voteRate: TotalMetric;

  @ApiProperty({ type: [Metric] })
  overview: Metric[];
}

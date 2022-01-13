import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';
import { TvlTotalMetric } from './tvl-total-metric.dto';

export class TvlDaoTotalResponse {
  @ApiProperty()
  grants: TvlTotalMetric;

  @ApiProperty()
  bounties: TvlTotalMetric;

  @ApiProperty()
  tvl: TotalMetric;
}

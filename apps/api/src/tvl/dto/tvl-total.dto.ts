import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class TvlTotalResponse {
  @ApiProperty()
  grants: {
    number: TotalMetric;
    vl: TotalMetric;
  };

  @ApiProperty()
  bounties: {
    number: TotalMetric;
    vl: TotalMetric;
  };

  @ApiProperty()
  tvl: TotalMetric;
}

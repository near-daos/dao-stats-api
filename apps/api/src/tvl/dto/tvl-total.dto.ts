import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class TvlTotalResponse {
  @ApiProperty()
  tvl: TotalMetric;

  @ApiProperty()
  avgTvl: TotalMetric;

  @ApiProperty()
  bountiesAndGrantsVl: TotalMetric;

  @ApiProperty()
  ftsVl: TotalMetric;
}

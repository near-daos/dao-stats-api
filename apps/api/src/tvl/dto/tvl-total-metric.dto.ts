import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class TvlTotalMetric {
  @ApiProperty()
  number: TotalMetric;

  @ApiProperty()
  vl: TotalMetric;
}

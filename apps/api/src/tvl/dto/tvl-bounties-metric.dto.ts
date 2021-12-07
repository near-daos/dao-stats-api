import { Metric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class TvlBountiesMetric {
  @ApiProperty()
  count: number;

  @ApiProperty()
  growth: number;

  @ApiProperty()
  overview: Metric[];
}

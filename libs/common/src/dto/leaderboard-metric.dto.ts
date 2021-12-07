import { ApiProperty } from '@nestjs/swagger';
import { Metric } from './metric.dto';
import { TotalMetric } from './total.dto';

export class LeaderboardMetric {
  @ApiProperty()
  dao: string;

  @ApiProperty()
  activity: TotalMetric;

  @ApiProperty({ type: [Metric] })
  overview: Metric[];
}

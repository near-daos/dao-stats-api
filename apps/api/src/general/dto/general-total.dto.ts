import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class GeneralTotalResponse {
  @ApiProperty()
  dao: TotalMetric;

  @ApiProperty()
  activity: TotalMetric;

  @ApiProperty()
  groups: TotalMetric;

  @ApiProperty()
  averageGroups: TotalMetric;
}

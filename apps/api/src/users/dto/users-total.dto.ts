import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class UsersTotalResponse {
  @ApiProperty()
  users: TotalMetric;

  @ApiProperty()
  council: TotalMetric;

  @ApiProperty()
  interactions: TotalMetric;
}

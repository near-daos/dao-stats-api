import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class UsersTotalResponse {
  @ApiProperty()
  users: TotalMetric;

  @ApiProperty()
  members: TotalMetric;

  @ApiProperty()
  averageUsers: TotalMetric;

  @ApiProperty()
  interactions: TotalMetric;

  @ApiProperty()
  averageInteractions: TotalMetric;

  @ApiProperty()
  activeUsers: TotalMetric;
}

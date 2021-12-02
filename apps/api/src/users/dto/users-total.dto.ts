import { TotalMetric } from '@dao-stats/common/dto/total.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UsersTotalResponse {
  @ApiProperty()
  users?: TotalMetric;

  @ApiProperty()
  council?: TotalMetric;

  @ApiProperty()
  interactions?: TotalMetric;
}

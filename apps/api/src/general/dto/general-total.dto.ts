import { TotalMetric } from '@dao-stats/common/dto/total.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GeneralTotalResponse {
  @ApiProperty()
  dao?: TotalMetric;

  @ApiProperty()
  activity?: TotalMetric;

  @ApiProperty()
  groups?: TotalMetric;
}

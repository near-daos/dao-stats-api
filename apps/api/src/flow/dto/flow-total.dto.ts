import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class FlowTotalResponse {
  @ApiProperty()
  transactions?: TotalMetric;
}

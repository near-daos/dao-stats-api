import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class FlowTotalResponse {
  @ApiProperty()
  totalIn: TotalMetric;

  @ApiProperty()
  totalOut: TotalMetric;

  @ApiProperty()
  transactions: TotalMetric;
}

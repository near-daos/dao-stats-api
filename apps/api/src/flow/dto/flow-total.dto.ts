import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class FlowTotalResponse {
  @ApiProperty()
  totalIn: TotalMetric;

  @ApiProperty()
  totalOut: TotalMetric;

  @ApiProperty()
  transactionsIn: TotalMetric;

  @ApiProperty()
  transactionsOut: TotalMetric;
}

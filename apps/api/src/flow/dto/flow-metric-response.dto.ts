import { Metric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class FlowMetricResponse {
  @ApiProperty({ type: [Metric] })
  in: Metric[];

  @ApiProperty({ type: [Metric] })
  out: Metric[];
}

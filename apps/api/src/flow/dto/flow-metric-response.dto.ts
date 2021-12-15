import { Metric } from '@dao-stats/common';
import { ApiProperty } from '@nestjs/swagger';

export class FlowMetricResponse {
  @ApiProperty({ type: [Metric] })
  incoming: Metric[];

  @ApiProperty({ type: [Metric] })
  outgoing: Metric[];
}

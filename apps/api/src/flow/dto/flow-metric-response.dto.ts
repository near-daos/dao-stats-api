import { ApiProperty } from '@nestjs/swagger';
import { FlowMetric } from './flow-metric.dto';

export class FlowMetricResponse {
  @ApiProperty({ type: [FlowMetric] })
  metrics: FlowMetric[];
}

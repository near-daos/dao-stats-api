import { ApiProperty } from '@nestjs/swagger';
import { Metric } from './metric.dto';

export class MetricResponse {
  @ApiProperty({ type: [Metric] })
  metrics: Metric[];
}

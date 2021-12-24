import { ApiProperty } from '@nestjs/swagger';

export enum MetricType {
  Total,
  Daily,
}

export class Metric {
  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  count: number;
}

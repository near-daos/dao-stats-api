import { ApiProperty } from '@nestjs/swagger';

export class TotalMetric {
  @ApiProperty()
  count: number;

  @ApiProperty()
  growth: number;
}

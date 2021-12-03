import { ApiProperty } from '@nestjs/swagger';

export class Metric {
  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  count: number;
}

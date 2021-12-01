import { ApiProperty } from '@nestjs/swagger';

export class Metric {
  @ApiProperty()
  start: number;

  @ApiProperty()
  end: number;

  @ApiProperty()
  count: number;
}

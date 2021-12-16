import { ApiProperty } from '@nestjs/swagger';

export class FlowMetric {
  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  incoming: number;

  @ApiProperty()
  outgoing: number;
}

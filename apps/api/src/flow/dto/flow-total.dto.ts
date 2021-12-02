import { TotalMetric } from '@dao-stats/common/dto/total.dto';
import { ApiProperty } from '@nestjs/swagger';

export class FlowTotalResponse {
  @ApiProperty()
  transactions?: TotalMetric;
}

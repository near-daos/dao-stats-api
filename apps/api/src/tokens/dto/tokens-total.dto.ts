import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class TokensTotalResponse {
  @ApiProperty()
  fts: TotalMetric;

  @ApiProperty()
  nfts: TotalMetric;
}

import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class TokensTotalResponse {
  @ApiProperty()
  ftTokens: TotalMetric;

  @ApiProperty()
  nftTokens: TotalMetric;
}

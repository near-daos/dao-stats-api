import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';

export class ActivityTotalResponse {
  @ApiProperty()
  proposals?: TotalMetric;

  @ApiProperty()
  ratio?: {
    total: number;
    proposals: [
      {
        type: string;
        count: number;
      },
    ];
  };

  @ApiProperty()
  rate?: TotalMetric;
}

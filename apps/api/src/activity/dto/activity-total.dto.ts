import { ApiProperty } from '@nestjs/swagger';
import { TotalMetric } from '@dao-stats/common';
import { ProposalsTypes } from './proposals-types.dto';

export class ActivityTotalResponse {
  @ApiProperty()
  proposals: TotalMetric;

  @ApiProperty()
  proposalsByType: ProposalsTypes;

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

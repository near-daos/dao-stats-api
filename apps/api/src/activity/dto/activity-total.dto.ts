import { TotalMetric } from '@dao-stats/common/dto/total.dto';
import { ApiProperty } from '@nestjs/swagger';

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

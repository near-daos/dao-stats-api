import { TotalMetric } from '@dao-stats/common/dto/total.dto';

export class ActivityTotalResponse {
  proposals?: TotalMetric;
  ratio?: {
    total: number;
    proposals: [
      {
        type: string;
        count: number;
      },
    ];
  };
  rate?: TotalMetric;
}

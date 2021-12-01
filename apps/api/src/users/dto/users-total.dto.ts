import { TotalMetric } from '@dao-stats/common/dto/total.dto';

export class UsersTotalResponse {
  users?: TotalMetric;
  council?: TotalMetric;
  interactions?: TotalMetric;
}

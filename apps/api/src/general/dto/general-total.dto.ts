import { TotalMetric } from '@dao-stats/common/dto/total.dto';

export class GeneralTotalResponse {
  dao?: TotalMetric;
  activity?: TotalMetric;
  groups?: TotalMetric;
}

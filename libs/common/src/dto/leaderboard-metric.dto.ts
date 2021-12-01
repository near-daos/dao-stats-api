import { Metric } from './metric.dto';
import { TotalMetric } from './total.dto';

export class LeaderboardMetric {
  dao: string;
  activity: TotalMetric;
  overview: Metric[];
}

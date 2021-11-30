import { Metric } from './metric.dto';

export class LeaderboardMetric {
  dao: string;
  activity: {
    count: number;
    growth: number;
  };
  overview: Metric[];
}

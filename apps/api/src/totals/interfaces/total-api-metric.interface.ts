import {
  ContractContext,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TotalMetric,
} from '@dao-stats/common';
import { ApiMetricService } from '../../common/interfaces/api-metric.interface';
import { TotalApiMetric } from '../types/total-metric-type';

export interface TotalApiMetricService<T extends TotalApiMetric>
  extends ApiMetricService<T> {
  getType(): T;

  getTotal(context: ContractContext): Promise<TotalMetric>;

  getHistory(
    context: ContractContext,
    metricQuery: MetricQuery,
    interval?: string,
  ): Promise<MetricResponse>;

  getLeaderboard(context: ContractContext): Promise<LeaderboardMetricResponse>;
}

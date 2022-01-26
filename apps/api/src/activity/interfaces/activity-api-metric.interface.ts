import {
  ContractContext,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TotalMetric,
} from '@dao-stats/common';
import { ActivityInterval } from '@dao-stats/common/types/activity-interval';

import { ApiMetricService } from '../../common/interfaces/api-metric.interface';
import { ActivityApiMetric } from '../types/activity-api-metric';

export interface ActivityApiMetricService<T extends ActivityApiMetric>
  extends ApiMetricService<T> {
  getType(): T;

  getActivity(
    context: ContractContext,
    interval: ActivityInterval,
  ): Promise<TotalMetric>;

  getHistory(
    context: ContractContext,
    metricQuery: MetricQuery,
    interval?: string,
  ): Promise<MetricResponse>;

  getLeaderboard(context: ContractContext): Promise<LeaderboardMetricResponse>;
}

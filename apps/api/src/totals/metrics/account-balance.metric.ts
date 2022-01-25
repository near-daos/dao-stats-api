import { Injectable } from '@nestjs/common';
import {
  ContractContext,
  DaoStatsMetric,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TotalMetric,
} from '@dao-stats/common';

import { MetricService } from '../../common/metric.service';
import { TotalApiMetric } from '../types/total-metric-type';
import { TotalApiMetricService } from '../interfaces/total-api-metric.interface';

@Injectable()
export class AccountBalanceApiMetricService
  implements TotalApiMetricService<TotalApiMetric.AccountBalance>
{
  constructor(private readonly metricService: MetricService) {}

  getType(): TotalApiMetric.AccountBalance {
    return TotalApiMetric.AccountBalance;
  }

  getTotal(context: ContractContext): Promise<TotalMetric> {
    return this.metricService.total(context, DaoStatsMetric.AccountBalance);
  }

  getHistory(
    context: ContractContext,
    metricQuery: MetricQuery,
    interval?: string,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.AccountBalance,
    );
  }

  getLeaderboard(context: ContractContext): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(
      context,
      DaoStatsMetric.AccountBalance,
    );
  }
}

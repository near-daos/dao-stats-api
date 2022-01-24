import moment from 'moment';
import { Injectable } from '@nestjs/common';
import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  MetricType,
  TotalMetric,
} from '@dao-stats/common';
import { getGrowth, patchMetricDays } from '../utils';

@Injectable()
export class MetricService {
  constructor(
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async total(
    context: DaoContractContext | ContractContext,
    metric: DaoStatsMetric | DaoStatsMetric[],
    averagePerDao?: boolean,
  ): Promise<TotalMetric> {
    const { contractId, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [current, prev] = await Promise.all([
      this.daoStatsService.getTotal({
        contractId,
        metric,
        dao,
        averagePerDao,
      }),
      this.daoStatsHistoryService.getLastValue({
        contractId,
        metric,
        dao,
        to: dayAgo.valueOf(),
        averagePerDao,
      }),
    ]);

    return {
      count: current,
      growth: getGrowth(current, prev),
    };
  }

  async history(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
    metric: DaoStatsMetric | DaoStatsMetric[],
    totals = true,
    averagePerDao?: boolean,
  ): Promise<MetricResponse> {
    const { contractId, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contractId,
      metric,
      dao,
      from,
      to,
      totals,
      averagePerDao,
    });

    const metrics = history.map(({ date, value }) => ({
      timestamp: date.valueOf(),
      count: value,
    }));

    return {
      metrics: patchMetricDays(
        metricQuery,
        metrics,
        totals ? MetricType.Total : MetricType.Daily,
      ),
    };
  }

  async leaderboard(
    context: ContractContext,
    metric: DaoStatsMetric | DaoStatsMetric[],
    overviewTotals = true,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId } = context;

    const dayAgo = moment().subtract(1, 'day');
    const monthAgo = moment().subtract(1, 'month');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, total }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getLastValue({
            contractId,
            metric,
            dao,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
            metric,
            dao,
            from: monthAgo.valueOf(),
            totals: overviewTotals,
          }),
        ]);

        const overview = history.map(({ date, value }) => ({
          timestamp: date.valueOf(),
          count: value,
        }));

        return {
          dao,
          activity: {
            count: total,
            growth: getGrowth(total, prevValue),
          },
          overview: patchMetricDays(
            { from: monthAgo.valueOf(), to: new Date().valueOf() },
            overview,
            overviewTotals ? MetricType.Total : MetricType.Daily,
            true,
          ),
        };
      }),
    );

    return { metrics };
  }
}

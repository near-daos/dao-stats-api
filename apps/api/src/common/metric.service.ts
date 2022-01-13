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
    daoAverage?: boolean,
  ): Promise<TotalMetric> {
    const { contractId, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [current, prev] = await Promise.all([
      this.daoStatsService.getTotal({
        contractId,
        dao,
        metric,
        daoAverage,
      }),
      this.daoStatsHistoryService.getLastTotal({
        contractId,
        dao,
        metric,
        daoAverage,
        to: dayAgo.valueOf(),
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
    daoAverage?: boolean,
  ): Promise<MetricResponse> {
    const { contractId, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contractId,
      dao,
      metric,
      daoAverage,
      from,
      to,
    });

    return {
      metrics: patchMetricDays(
        metricQuery,
        history.map(({ date, total }) => ({
          timestamp: date.valueOf(),
          count: total,
        })),
        MetricType.Total,
      ),
    };
  }

  async leaderboard(
    context: ContractContext,
    metric: DaoStatsMetric | DaoStatsMetric[],
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
          this.daoStatsHistoryService.getLastTotal({
            contractId,
            dao,
            metric,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
            dao,
            metric,
            from: monthAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: total,
            growth: getGrowth(total, prevValue),
          },
          overview: history.map(({ date, total }) => ({
            timestamp: date.valueOf(),
            count: total,
          })),
        };
      }),
    );

    return { metrics };
  }
}

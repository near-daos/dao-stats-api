import moment from 'moment';
import { Injectable } from '@nestjs/common';
import {
  ContractContext,
  DaoContractContext,
  DaoStatsAggregateFunction,
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
    metric: DaoStatsMetric,
    func = DaoStatsAggregateFunction.Sum,
  ): Promise<TotalMetric> {
    const { contractId, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [current, prev] = await Promise.all([
      this.daoStatsService.getValue({
        contractId,
        dao,
        metric,
        func,
      }),
      this.daoStatsHistoryService.getValue({
        contractId,
        dao,
        metric,
        func,
        to: dayAgo.valueOf(),
      }),
    ]);

    console.log(current, prev);

    return {
      count: current,
      growth: getGrowth(current, prev),
    };
  }

  async history(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
    metric: DaoStatsMetric,
    func = DaoStatsAggregateFunction.Sum,
  ): Promise<MetricResponse> {
    const { contractId, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contractId,
      dao,
      metric,
      func,
      from,
      to,
    });

    return {
      metrics: patchMetricDays(
        metricQuery,
        history.map((row) => ({
          timestamp: row.date.valueOf(),
          count: row.value,
        })),
        MetricType.Total,
      ),
    };
  }

  async leaderboard(
    context: ContractContext,
    metric: DaoStatsMetric,
    func = DaoStatsAggregateFunction.Sum,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId } = context;

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric,
      func,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contractId,
            dao,
            metric,
            func,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
            dao,
            metric,
            func,
            from: weekAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: value,
            growth: getGrowth(value, prevValue),
          },
          overview: history.map((row) => ({
            timestamp: row.date.valueOf(),
            count: row.value,
          })),
        };
      }),
    );

    return { metrics };
  }
}

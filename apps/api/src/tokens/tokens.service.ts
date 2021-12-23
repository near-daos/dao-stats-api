import moment from 'moment';
import { Injectable } from '@nestjs/common';

import {
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricType,
} from '@dao-stats/common';
import { TokensTotalResponse } from './dto/tokens-total.dto';
import { getGrowth, patchMetricDays } from '../utils';

@Injectable()
export class TokensService {
  constructor(
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(): Promise<TokensTotalResponse> {
    const dayAgo = moment().subtract(1, 'day');

    const [ftsCount, ftsCountPrev, nftsCount, nftsCountPrev] =
      await Promise.all([
        this.daoStatsService.getValue({
          metric: DaoStatsMetric.FtsCount,
        }),
        this.daoStatsHistoryService.getValue({
          metric: DaoStatsMetric.FtsCount,
          to: dayAgo.valueOf(),
        }),
        this.daoStatsService.getValue({
          metric: DaoStatsMetric.NftsCount,
        }),
        this.daoStatsHistoryService.getValue({
          metric: DaoStatsMetric.NftsCount,
          to: dayAgo.valueOf(),
        }),
      ]);

    return {
      fts: {
        count: ftsCount,
        growth: getGrowth(ftsCount, ftsCountPrev),
      },
      nfts: {
        count: nftsCount,
        growth: getGrowth(nftsCount, nftsCountPrev),
      },
    };
  }

  async fts(metricQuery: MetricQuery): Promise<any> {
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      metric: DaoStatsMetric.FtsCount,
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

  async nfts(metricQuery: MetricQuery): Promise<any> {
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      metric: DaoStatsMetric.NftsCount,
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

  async ftsLeaderboard(): Promise<LeaderboardMetricResponse> {
    const leaderboard = await this.daoStatsService.getLeaderboard({
      metric: DaoStatsMetric.FtsCount,
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            dao,
            metric: DaoStatsMetric.FtsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            dao,
            metric: DaoStatsMetric.FtsCount,
            from: weekAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: value,
            growth: getGrowth(value, countPrev),
          },
          overview: countHistory.map((row) => ({
            timestamp: row.date.valueOf(),
            count: row.value,
          })),
        };
      }),
    );

    return { metrics };
  }

  async nftsLeaderboard(): Promise<LeaderboardMetricResponse> {
    const leaderboard = await this.daoStatsService.getLeaderboard({
      metric: DaoStatsMetric.NftsCount,
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            dao,
            metric: DaoStatsMetric.NftsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            dao,
            metric: DaoStatsMetric.NftsCount,
            from: weekAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: value,
            growth: getGrowth(value, countPrev),
          },
          overview: countHistory.map((row) => ({
            timestamp: row.date.valueOf(),
            count: row.value,
          })),
        };
      }),
    );

    return { metrics };
  }
}

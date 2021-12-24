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

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<TokensTotalResponse> {
    const { contractId, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'day');

    const [ftsCount, ftsCountPrev, nftsCount, nftsCountPrev] =
      await Promise.all([
        this.daoStatsService.getValue({
          contractId,
          dao,
          metric: DaoStatsMetric.FtsCount,
        }),
        this.daoStatsHistoryService.getValue({
          contractId,
          dao,
          metric: DaoStatsMetric.FtsCount,
          to: dayAgo.valueOf(),
        }),
        this.daoStatsService.getValue({
          contractId,
          dao,
          metric: DaoStatsMetric.NftsCount,
        }),
        this.daoStatsHistoryService.getValue({
          contractId,
          dao,
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

  async fts(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    const { contractId, dao } = context as DaoContractContext;

    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contractId,
      dao,
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

  async nfts(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    const { contractId, dao } = context as DaoContractContext;

    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contractId,
      dao,
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

  async ftsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric: DaoStatsMetric.FtsCount,
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contractId,
            dao,
            metric: DaoStatsMetric.FtsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
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

  async nftsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric: DaoStatsMetric.NftsCount,
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contractId,
            dao,
            metric: DaoStatsMetric.NftsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
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

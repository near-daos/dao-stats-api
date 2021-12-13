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
} from '@dao-stats/common';
import { TokensTotalResponse } from './dto/tokens-total.dto';
import { getGrowth } from '../utils';

@Injectable()
export class TokensService {
  constructor(
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<TokensTotalResponse> {
    const { contract, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'day');

    const [
      ftTokensCount,
      ftTokensCountPrev,
      nftTokensCount,
      nftTokensCountPrev,
    ] = await Promise.all([
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.TokensFtCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.TokensFtCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.TokensNftCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.TokensNftCount,
        to: dayAgo.valueOf(),
      }),
    ]);

    return {
      ftTokens: {
        count: ftTokensCount,
        growth: getGrowth(ftTokensCount, ftTokensCountPrev),
      },
      nftTokens: {
        count: nftTokensCount,
        growth: getGrowth(nftTokensCount, nftTokensCountPrev),
      },
    };
  }

  async ftTokens(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.TokensFtCount,
      from,
      to,
    });

    return {
      metrics: history.map((row) => ({
        timestamp: row.date.valueOf(),
        count: row.value,
      })),
    };
  }

  async nftTokens(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.TokensNftCount,
      from,
      to,
    });

    return {
      metrics: history.map((row) => ({
        timestamp: row.date.valueOf(),
        count: row.value,
      })),
    };
  }

  async ftTokensLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.TokensFtCount,
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.TokensFtCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contract,
            dao,
            metric: DaoStatsMetric.TokensFtCount,
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

  async nftTokensLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.TokensNftCount,
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.TokensNftCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contract,
            dao,
            metric: DaoStatsMetric.TokensNftCount,
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

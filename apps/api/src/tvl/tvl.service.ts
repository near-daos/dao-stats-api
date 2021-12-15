import moment from 'moment';
import { Injectable } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  MetricQuery,
} from '@dao-stats/common';
import { TvlTotalResponse } from './dto/tvl-total.dto';
import { getGrowth } from '../utils';
import { TvlBountiesLeaderboardResponse } from './dto/tvl-bounties-leaderboard-response.dto';

@Injectable()
export class TvlService {
  constructor(
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<TvlTotalResponse> {
    const { contract, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'day');

    const [
      bountiesCount,
      bountiesCountPrev,
      bountiesValueLocked,
      bountiesValueLockedPrev,
    ] = await Promise.all([
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesValueLocked,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.BountiesValueLocked,
        to: dayAgo.valueOf(),
      }),
    ]);

    return {
      // TODO
      grants: {
        number: {
          count: 0,
          growth: 0,
        },
        vl: {
          count: 0,
          growth: 0,
        },
      },
      // TODO
      bounties: {
        number: {
          count: bountiesCount,
          growth: getGrowth(bountiesCount, bountiesCountPrev),
        },
        vl: {
          count: bountiesValueLocked,
          growth: getGrowth(bountiesValueLocked, bountiesValueLockedPrev),
        },
      },
      // TODO
      tvl: {
        count: 0,
        growth: 0,
      },
    };
  }

  async bountiesNumber(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.BountiesCount,
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

  async bountiesValueLocked(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    const { contract, dao } = context as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.BountiesValueLocked,
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

  async bountiesLeaderboard(
    context: ContractContext,
  ): Promise<TvlBountiesLeaderboardResponse> {
    const { contract } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.BountiesCount, // TODO confirm
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory, vl, vlPrev, vlHistory] =
          await Promise.all([
            this.daoStatsHistoryService.getValue({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesCount,
              from: weekAgo.valueOf(),
            }),
            this.daoStatsService.getValue({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
            }),
            this.daoStatsHistoryService.getValue({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contract,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
              from: weekAgo.valueOf(),
            }),
          ]);

        return {
          dao,
          number: {
            count: value,
            growth: getGrowth(value, countPrev),
            overview: countHistory.map((row) => ({
              timestamp: row.date.valueOf(),
              count: row.value,
            })),
          },
          vl: {
            count: vl,
            growth: getGrowth(vl, vlPrev),
            overview: vlHistory.map((row) => ({
              timestamp: row.date.valueOf(),
              count: row.value,
            })),
          },
        };
      }),
    );

    return { metrics };
  }
}

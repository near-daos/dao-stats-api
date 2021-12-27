import moment from 'moment';
import { Injectable } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  MetricQuery,
  MetricResponse,
} from '@dao-stats/common';
import { TvlTotalResponse } from './dto/tvl-total.dto';
import { TvlBountiesLeaderboardResponse } from './dto/tvl-bounties-leaderboard-response.dto';
import { MetricService } from '../common/metric.service';
import { getGrowth } from '../utils';

@Injectable()
export class TvlService {
  constructor(
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
    private readonly metricService: MetricService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<TvlTotalResponse> {
    const [bountiesNumber, bountiesValueLocked] = await Promise.all([
      this.metricService.total(context, DaoStatsMetric.BountiesCount),
      this.metricService.total(context, DaoStatsMetric.BountiesValueLocked),
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
      bounties: {
        number: bountiesNumber,
        vl: bountiesValueLocked,
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
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.BountiesCount,
    );
  }

  async bountiesValueLocked(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.BountiesValueLocked,
    );
  }

  async bountiesLeaderboard(
    context: ContractContext,
  ): Promise<TvlBountiesLeaderboardResponse> {
    const { contractId } = context;

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric: DaoStatsMetric.BountiesCount, // TODO confirm
    });

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [countPrev, countHistory, vl, vlPrev, vlHistory] =
          await Promise.all([
            this.daoStatsHistoryService.getValue({
              contractId,
              dao,
              metric: DaoStatsMetric.BountiesCount,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contractId,
              dao,
              metric: DaoStatsMetric.BountiesCount,
              from: weekAgo.valueOf(),
            }),
            this.daoStatsService.getValue({
              contractId,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
            }),
            this.daoStatsHistoryService.getValue({
              contractId,
              dao,
              metric: DaoStatsMetric.BountiesValueLocked,
              to: dayAgo.valueOf(),
            }),
            this.daoStatsHistoryService.getHistory({
              contractId,
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

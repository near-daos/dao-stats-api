import { Injectable } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsMetricGroup,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
} from '@dao-stats/common';
import { TvlTotalResponse } from './dto/tvl-total.dto';
import { TvlDaoTotalResponse } from './dto/tvl-dao-total.dto';
import { MetricService } from '../common/metric.service';

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
    const [tvl, avgTvl, bountiesAndGrantsVl, ftsVl] = await Promise.all([
      this.metricService.total(context, DaoStatsMetricGroup.TotalValueLocked),
      this.metricService.total(
        context,
        DaoStatsMetricGroup.TotalValueLocked,
        true,
      ),
      this.metricService.total(
        context,
        DaoStatsMetricGroup.BountiesAndGrantsValueLocked,
      ),
      this.metricService.total(context, DaoStatsMetric.FtsValueLocked),
    ]);

    return {
      tvl,
      avgTvl,
      bountiesAndGrantsVl,
      ftsVl,
    };
  }

  async daoTotals(
    context: DaoContractContext | ContractContext,
  ): Promise<TvlDaoTotalResponse> {
    const [bountiesCount, bountiesVl, tvl] = await Promise.all([
      this.metricService.total(context, DaoStatsMetric.BountiesCount),
      this.metricService.total(context, DaoStatsMetric.BountiesValueLocked),
      this.metricService.total(context, DaoStatsMetricGroup.TotalValueLocked),
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
        number: bountiesCount,
        vl: bountiesVl,
      },
      tvl,
    };
  }

  async tvl(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetricGroup.TotalValueLocked,
    );
  }

  async tvlLeaderboard(
    context: ContractContext | DaoContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(
      context,
      DaoStatsMetricGroup.TotalValueLocked,
    );
  }

  async avgTvl(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetricGroup.TotalValueLocked,
      true,
    );
  }

  async bountiesAndGrantsValueLocked(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetricGroup.BountiesAndGrantsValueLocked,
    );
  }

  async bountiesAndGrantsValueLockedLeaderboard(
    context: ContractContext | DaoContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(
      context,
      DaoStatsMetricGroup.BountiesAndGrantsValueLocked,
    );
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
}

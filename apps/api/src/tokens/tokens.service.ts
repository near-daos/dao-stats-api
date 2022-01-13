import { Injectable } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsMetric,
  LeaderboardMetricResponse,
  MetricQuery,
} from '@dao-stats/common';
import { TokensTotalResponse } from './dto/tokens-total.dto';
import { MetricService } from '../common/metric.service';

@Injectable()
export class TokensService {
  constructor(private readonly metricService: MetricService) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<TokensTotalResponse> {
    const [fts, ftsVl, nfts] = await Promise.all([
      this.metricService.total(context, DaoStatsMetric.FtsCount),
      this.metricService.total(context, DaoStatsMetric.FtsValueLocked),
      this.metricService.total(context, DaoStatsMetric.NftsCount),
    ]);

    return {
      fts,
      ftsVl,
      nfts,
    };
  }

  async fts(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.FtsCount,
    );
  }

  async ftsValueLocked(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.FtsValueLocked,
    );
  }

  async nfts(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<any> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.NftsCount,
    );
  }

  async ftsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(context, DaoStatsMetric.FtsCount);
  }

  async ftsValueLockedLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(
      context,
      DaoStatsMetric.FtsValueLocked,
    );
  }

  async nftsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(context, DaoStatsMetric.NftsCount);
  }
}

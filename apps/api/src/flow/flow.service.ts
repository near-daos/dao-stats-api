import { Injectable } from '@nestjs/common';
import {
  ContractContext,
  DaoContractContext,
  DaoStatsMetricGroup,
  MetricQuery,
} from '@dao-stats/common';
import { FlowMetricType } from '@dao-stats/receipt';
import {
  FlowLeaderboardMetricResponse,
  FlowMetricResponse,
  FlowTotalResponse,
} from './dto';
import { MetricService } from '../common/metric.service';

@Injectable()
export class FlowService {
  constructor(private readonly metricService: MetricService) {}

  async totals(
    context: ContractContext,
    platform: boolean,
  ): Promise<FlowTotalResponse> {
    const [totalIn, totalOut, transactionsIn, transactionsOut] =
      await Promise.all([
        this.metricService.total(
          context,
          platform
            ? DaoStatsMetricGroup.PlatformActionsDepositInValue
            : DaoStatsMetricGroup.DaoActionsDepositInValue,
        ),
        this.metricService.total(
          context,
          platform
            ? DaoStatsMetricGroup.PlatformActionsDepositOutValue
            : DaoStatsMetricGroup.DaoActionsDepositOutValue,
        ),
        this.metricService.total(
          context,
          platform
            ? DaoStatsMetricGroup.PlatformActionsDepositInCount
            : DaoStatsMetricGroup.DaoActionsDepositInCount,
        ),
        this.metricService.total(
          context,
          platform
            ? DaoStatsMetricGroup.PlatformActionsDepositOutCount
            : DaoStatsMetricGroup.DaoActionsDepositOutCount,
        ),
      ]);

    return {
      totalIn,
      totalOut,
      transactionsIn,
      transactionsOut,
    };
  }

  async history(
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
    metricQuery: MetricQuery,
    platform: boolean,
  ): Promise<FlowMetricResponse> {
    const [incoming, outgoing] = await Promise.all([
      this.metricService.history(
        context,
        metricQuery,
        platform
          ? metricType === FlowMetricType.Fund
            ? DaoStatsMetricGroup.PlatformActionsDepositInValue
            : DaoStatsMetricGroup.PlatformActionsDepositInCount
          : metricType === FlowMetricType.Fund
          ? DaoStatsMetricGroup.DaoActionsDepositInValue
          : DaoStatsMetricGroup.DaoActionsDepositInCount,
        false,
      ),
      this.metricService.history(
        context,
        metricQuery,
        platform
          ? metricType === FlowMetricType.Fund
            ? DaoStatsMetricGroup.PlatformActionsDepositOutValue
            : DaoStatsMetricGroup.PlatformActionsDepositOutCount
          : metricType === FlowMetricType.Fund
          ? DaoStatsMetricGroup.DaoActionsDepositOutValue
          : DaoStatsMetricGroup.DaoActionsDepositOutCount,
        false,
      ),
    ]);

    const timestamps = [
      ...new Set([
        ...incoming.metrics.map(({ timestamp }) => timestamp),
        ...outgoing.metrics.map(({ timestamp }) => timestamp),
      ]),
    ].sort((a, b) => a - b);

    return {
      metrics: timestamps.map((timestamp) => ({
        timestamp,
        incoming:
          incoming.metrics.find(({ timestamp: t }) => timestamp == t)?.count ||
          0,
        outgoing:
          outgoing.metrics.find(({ timestamp: t }) => timestamp == t)?.count ||
          0,
      })),
    };
  }

  async leaderboard(
    context: DaoContractContext | ContractContext,
    metricType: FlowMetricType,
  ): Promise<FlowLeaderboardMetricResponse> {
    const [incoming, outgoing] = await Promise.all([
      this.metricService.leaderboard(
        context,
        metricType === FlowMetricType.Fund
          ? DaoStatsMetricGroup.PlatformActionsDepositInValue
          : DaoStatsMetricGroup.PlatformActionsDepositInCount,
        false,
      ),
      this.metricService.leaderboard(
        context,
        metricType === FlowMetricType.Fund
          ? DaoStatsMetricGroup.PlatformActionsDepositOutValue
          : DaoStatsMetricGroup.PlatformActionsDepositOutCount,
        false,
      ),
    ]);

    return {
      incoming: incoming.metrics,
      outgoing: outgoing.metrics,
    };
  }
}

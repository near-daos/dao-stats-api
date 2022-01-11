import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  MetricType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GeneralTotalResponse } from './dto';
import { MetricService } from '../common/metric.service';
import { getDailyIntervals, getGrowth, patchMetricDays } from '../utils';

@Injectable()
export class GeneralService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
    private readonly metricService: MetricService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GeneralTotalResponse> {
    const dayAgo = moment().subtract(1, 'days');

    const [dao, groups, averageGroups, activity, dayAgoActivity] =
      await Promise.all([
        this.metricService.total(context, DaoStatsMetric.DaoCount),
        this.metricService.total(context, DaoStatsMetric.GroupsCount),
        this.metricService.total(context, DaoStatsMetric.GroupsCount, true),
        this.transactionService.getContractActivityCount(context, {
          to: dayAgo.valueOf(),
        }),
        this.transactionService.getContractActivityCount(context),
      ]);

    return {
      dao,
      activity: {
        count: activity.count,
        growth: getGrowth(activity.count, dayAgoActivity.count),
      },
      groups,
      averageGroups,
    };
  }

  async daos(
    context: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.DaoCount,
    );
  }

  async active(
    context: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getContractActivityCountDaily(
      context,
      metricQuery,
    );

    return {
      metrics: patchMetricDays(
        metricQuery,
        metrics.map(({ day, count }) => ({
          timestamp: moment(day).valueOf(),
          count,
        })),
        MetricType.Daily,
      ),
    };
  }

  async activeLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());

    const byDays = await this.transactionService.getActivityLeaderboard(
      context,
      {
        from: weekAgo.valueOf(),
        to: moment().valueOf(),
      },
      true,
    );

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoActivity = await this.transactionService.getActivityLeaderboard(
      context,
      {
        to: dayAgo.valueOf(),
      },
    );

    const totalActivity = await this.transactionService.getActivityLeaderboard(
      context,
      {
        to: moment().valueOf(),
      },
    );

    const metrics = totalActivity.map(({ receiver_account_id: dao, count }) => {
      const dayAgoCount =
        dayAgoActivity.find(
          ({ receiver_account_id }) => receiver_account_id === dao,
        )?.count || 0;

      return {
        dao,
        activity: {
          count,
          growth: getGrowth(count, dayAgoCount),
        },
        overview: days.map(({ end: timestamp }) => ({
          timestamp,
          count:
            byDays.find(
              ({ receiver_account_id, day }) =>
                receiver_account_id === dao &&
                moment(day).isSame(moment(timestamp), 'day'),
            )?.count || 0,
        })),
      };
    });

    return { metrics };
  }

  async groups(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.GroupsCount,
    );
  }

  async groupsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(context, DaoStatsMetric.GroupsCount);
  }

  async averageGroups(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.GroupsCount,
      true,
    );
  }
}

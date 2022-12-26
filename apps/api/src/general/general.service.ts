import moment from 'moment';
import { Injectable } from '@nestjs/common';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsMetric,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  ActivityInterval,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';

import { GeneralTotalResponse } from './dto';
import { MetricService } from '../common/metric.service';
import { getDailyIntervals, getGrowth } from '../utils';

@Injectable()
export class GeneralService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly metricService: MetricService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GeneralTotalResponse> {
    const monthAgo = moment().subtract(1, 'month');
    const twoMonthsAgo = moment().subtract(2, 'months');

    const [dao, groups, averageGroups, activity, monthAgoActivity] =
      await Promise.all([
        this.metricService.total(context, DaoStatsMetric.DaoCount),
        this.metricService.total(context, DaoStatsMetric.GroupsCount),
        this.metricService.total(context, DaoStatsMetric.GroupsCount, true),
        this.transactionService.getContractActivityCount(context, {
          from: monthAgo.valueOf(),
        }),
        this.transactionService.getContractActivityCount(context, {
          from: twoMonthsAgo.valueOf(),
          to: monthAgo.valueOf(),
        }),
      ]);

    return {
      dao,
      activity: {
        count: activity.count,
        growth: getGrowth(activity.count, monthAgoActivity.count),
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
    const metrics =
      await this.transactionService.getContractActivityCountHistory(
        context,
        metricQuery,
        ActivityInterval.Week,
      );

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async activeLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const monthAgo = moment().subtract(1, 'month');
    const days = getDailyIntervals(monthAgo.valueOf(), moment().valueOf());

    const byDays = await this.transactionService.getActivityLeaderboard(
      context,
      {
        from: monthAgo.valueOf(),
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

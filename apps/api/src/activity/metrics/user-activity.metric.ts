import { Injectable } from '@nestjs/common';
import moment from 'moment';

import {
  ContractContext,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  TotalMetric,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { ActivityInterval } from '@dao-stats/common/types/activity-interval';

import { ActivityApiMetricService } from '../interfaces/activity-api-metric.interface';
import { getDailyIntervals, getGrowth } from '../../utils';
import { ActivityApiMetric } from '../types/activity-api-metric';

@Injectable()
export class UserActivityApiMetricService
  implements ActivityApiMetricService<ActivityApiMetric>
{
  constructor(private readonly transactionService: TransactionService) {}

  getType(): ActivityApiMetric.UserActivity {
    return ActivityApiMetric.UserActivity;
  }

  async getActivity(
    context: ContractContext,
    interval: ActivityInterval,
  ): Promise<TotalMetric> {
    const intervalAgo = moment().subtract(1, interval);
    const growthIntervalAgo = moment().subtract(2, interval);

    const [activity, monthAgoActivity] = await Promise.all([
      this.transactionService.getUsersTotalCount(context, {
        from: intervalAgo.valueOf(),
      }),
      this.transactionService.getUsersTotalCount(context, {
        from: growthIntervalAgo.valueOf(),
        to: intervalAgo.valueOf(),
      }),
    ]);

    return {
      count: activity.count,
      growth: getGrowth(activity.count, monthAgoActivity.count),
    };
  }

  async getHistory(
    context: ContractContext,
    metricQuery: MetricQuery,
    interval?: ActivityInterval,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getUsersTotalCountHistory(
      context,
      metricQuery,
      interval,
    );

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async getLeaderboard(
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
}

import moment from 'moment';
import { Injectable, Logger } from '@nestjs/common';
import PromisePool from '@supercharge/promise-pool';

import {
  ContractContext,
  DailyMetric,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  MetricType,
  ActivityInterval,
  IntervalMetricQuery,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';

import { MetricService } from '../common/metric.service';
import { UsersTotalResponse } from './dto';
import {
  getAverage,
  getDailyIntervals,
  getGrowth,
  patchMetricDays,
} from '../utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
    private readonly metricService: MetricService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<UsersTotalResponse> {
    const dayAgo = moment().subtract(1, 'days');

    const weekAgo = moment().subtract(1, 'week');
    const twoWeeksAgo = moment().subtract(2, 'week');

    const [
      usersCount,
      dayAgoUsersCount,
      daoUsers,
      dayAgoDaoUsers,
      interactions,
      dayAgoInteractions,
      daoInteractions,
      dayAgoDaoInteractions,
      members,
      activeUsers,
      weekAgoActiveUsers,
    ] = await Promise.all([
      this.transactionService.getUsersTotalCount(context),
      this.transactionService.getUsersTotalCount(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getDaoUsers(context),
      this.transactionService.getDaoUsers(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getInteractionsCount(context),
      this.transactionService.getInteractionsCount(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getDaoInteractions(context),
      this.transactionService.getDaoInteractions(context, {
        to: dayAgo.valueOf(),
      }),
      this.metricService.total(context, DaoStatsMetric.MembersCount),
      this.transactionService.getUsersTotalCount(context, {
        from: weekAgo.valueOf(),
      }),
      this.transactionService.getUsersTotalCount(context, {
        from: twoWeeksAgo.valueOf(),
        to: weekAgo.valueOf(),
      }),
    ]);

    const avgDaoUsers = getAverage(daoUsers.map(({ count }) => count));
    const dayAgoAvgDaoUsers = getAverage(
      dayAgoDaoUsers.map(({ count }) => count),
    );

    const avgDaoInteractions = getAverage(
      daoInteractions.map(({ count }) => count),
    );
    const dayAgoAvgDaoInteractions = getAverage(
      dayAgoDaoInteractions.map(({ count }) => count),
    );

    return {
      users: {
        count: usersCount.count,
        growth: getGrowth(usersCount.count, dayAgoUsersCount.count),
      },
      members,
      averageUsers: {
        count: avgDaoUsers,
        growth: getGrowth(avgDaoUsers, dayAgoAvgDaoUsers),
      },
      interactions: {
        count: interactions.count,
        growth: getGrowth(interactions.count, dayAgoInteractions.count),
      },
      averageInteractions: {
        count: avgDaoInteractions,
        growth: getGrowth(avgDaoInteractions, dayAgoAvgDaoInteractions),
      },
      activeUsers: {
        count: activeUsers.count,
        growth: getGrowth(activeUsers.count, weekAgoActiveUsers.count),
      },
    };
  }

  async users(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;
    // TODO: optimize day-by-day querying
    const { results: byDays } = await PromisePool.withConcurrency(5)
      .for(getDailyIntervals(from, to || moment().valueOf()))
      .handleError((e) => this.logger.error(e))
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getUsersTotalCount(context, {
          to: end,
        });

        return { ...qr, start, end };
      });

    return this.combineDailyMetrics(byDays);
  }

  async usersLeaderboard(
    context: ContractContext,
    interval?: ActivityInterval,
  ): Promise<LeaderboardMetricResponse> {
    const monthAgo = moment().subtract(1, 'month');
    const days = getDailyIntervals(monthAgo.valueOf(), moment().valueOf());

    const { results: byDays } = await PromisePool.withConcurrency(5)
      .for(days)
      .handleError((e) => this.logger.error(e))
      .process(async ({ start, end }) => {
        const query = interval ? { from: start, to: end } : { to: end };
        const qr = await this.transactionService.getDaoUsers(context, query);

        return { usersCount: [...qr], start, end };
      });

    const currentInterval = moment().subtract(1, interval || 'days');
    const intervalAgo = moment().subtract(2, interval);
    const [dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getDaoUsers(context, {
        from: interval ? intervalAgo.valueOf() : null,
        to: interval ? currentInterval.valueOf() : currentInterval.valueOf(),
      }),
      this.transactionService.getDaoUsers(context, {
        from: interval ? currentInterval.valueOf() : null,
        to: moment().valueOf(),
      }),
    ]);

    const metrics = totalActivity
      .slice(0, 10)
      .map(({ receiver_account_id: dao, count }) => {
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
              byDays
                .find(({ end }) => end === timestamp)
                ?.usersCount?.find(
                  ({ receiver_account_id }) => receiver_account_id === dao,
                )?.count || 0,
          })),
        };
      });

    return { metrics };
  }

  async activeUsers(
    context: DaoContractContext | ContractContext,
    metricQuery: IntervalMetricQuery,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getUsersTotalCountHistory(
      context,
      metricQuery,
    );

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async members(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    return this.metricService.history(
      context,
      metricQuery,
      DaoStatsMetric.MembersCount,
    );
  }

  async membersLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    return this.metricService.leaderboard(context, DaoStatsMetric.MembersCount);
  }

  async averageUsers(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    const days = getDailyIntervals(from, to || moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays } = await PromisePool.withConcurrency(5)
      .for(days)
      .handleError((e) => this.logger.error(e))
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getDaoUsers(context, {
          to: end,
        });

        return { count: getAverage(qr.map(({ count }) => count)), start, end };
      });

    return this.combineDailyMetrics(byDays);
  }

  async interactions(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getInteractionsCountDaily(
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

  async interactionsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const monthAgo = moment().subtract(1, 'month');
    const days = getDailyIntervals(monthAgo.valueOf(), moment().valueOf());
    const dayAgo = moment().subtract(1, 'days');

    const [byDays, dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getActivityLeaderboard(
        context,
        {
          from: monthAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.transactionService.getActivityLeaderboard(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getActivityLeaderboard(context, {
        to: moment().valueOf(),
      }),
    ]);

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

  async averageInteractions(
    context: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    // TODO: optimize day-by-day querying
    const { results: byDays } = await PromisePool.withConcurrency(5)
      .for(getDailyIntervals(from, to || moment().valueOf()))
      .handleError((e) => this.logger.error(e))
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getDaoInteractions(context, {
          to: end,
        });

        return { count: getAverage(qr.map(({ count }) => count)), start, end };
      });

    return this.combineDailyMetrics(byDays);
  }

  private combineDailyMetrics(byDays: DailyMetric[]): MetricResponse {
    return {
      metrics: byDays
        .flat()
        .sort((a, b) => a.end - b.end)
        .map(({ end: timestamp, count }) => ({
          timestamp,
          count,
        })),
    };
  }
}

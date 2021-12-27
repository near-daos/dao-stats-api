import moment from 'moment';
import { Injectable, Logger } from '@nestjs/common';
import PromisePool from '@supercharge/promise-pool';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsAggregateFunction,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  MetricType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { UsersTotalResponse } from './dto/users-total.dto';
import {
  getAverage,
  getDailyIntervals,
  getGrowth,
  patchMetricDays,
} from '../utils';
import { DailyMetric } from '@dao-stats/common/dto/daily-metric.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<UsersTotalResponse> {
    const { contractId, dao } = context as DaoContractContext;
    const dayAgo = moment().subtract(1, 'days');

    const [
      usersCount,
      dayAgoUsersCount,
      daoUsers,
      dayAgoDaoUsers,
      interactions,
      dayAgoInteractions,
      daoInteractions,
      dayAgoDaoInteractions,
      membersCount,
      dayAgoMembersCount,
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
      this.daoStatsService.getValue({
        contractId,
        dao,
        metric: DaoStatsMetric.MembersCount,
      }),
      this.daoStatsHistoryService.getValue({
        contractId,
        dao,
        metric: DaoStatsMetric.MembersCount,
        to: dayAgo.valueOf(),
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
      members: {
        count: membersCount,
        growth: getGrowth(membersCount, dayAgoMembersCount),
      },
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
    };
  }

  async users(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;
    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(getDailyIntervals(from, to || moment().valueOf()))
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getUsersTotalCount(context, {
          to: end,
        });

        return { ...qr, start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    return this.combineDailyMetrics(byDays);
  }

  async usersLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());

    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getDaoUsers(context, {
          to: end,
        });

        return { usersCount: [...qr], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const [dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getDaoUsers(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getDaoUsers(context, {
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

  async members(
    contractContext: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contractId, dao } = contractContext as DaoContractContext;

    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contractId,
      dao,
      metric: DaoStatsMetric.MembersCount,
      from,
      to,
    });

    return {
      metrics: patchMetricDays(
        metricQuery,
        history.map((row) => ({
          timestamp: row.date.valueOf(),
          count: row.value,
        })),
        MetricType.Total,
      ),
    };
  }

  async membersLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId } = contractContext;

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric: DaoStatsMetric.MembersCount,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contractId,
            dao,
            metric: DaoStatsMetric.MembersCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
            dao,
            metric: DaoStatsMetric.MembersCount,
            from: weekAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: value,
            growth: getGrowth(value, prevValue),
          },
          overview: history.map((row) => ({
            timestamp: row.date.valueOf(),
            count: row.value,
          })),
        };
      }),
    );

    return { metrics };
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

  async councilLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId } = contractContext;

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contractId,
      metric: DaoStatsMetric.CouncilSize,
      func: DaoStatsAggregateFunction.Average,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contractId,
            dao,
            metric: DaoStatsMetric.CouncilSize,
            func: DaoStatsAggregateFunction.Average,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contractId,
            dao,
            metric: DaoStatsMetric.CouncilSize,
            func: DaoStatsAggregateFunction.Average,
            from: weekAgo.valueOf(),
          }),
        ]);

        return {
          dao,
          activity: {
            count: value,
            growth: getGrowth(value, prevValue),
          },
          overview: history.map((row) => ({
            timestamp: row.date.valueOf(),
            count: row.value,
          })),
        };
      }),
    );

    return { metrics };
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
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());
    const dayAgo = moment().subtract(1, 'days');

    const [byDays, dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getActivityLeaderboard(
        context,
        {
          from: weekAgo.valueOf(),
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

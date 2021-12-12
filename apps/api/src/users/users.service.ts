import moment from 'moment';
import { Injectable, Logger } from '@nestjs/common';
import PromisePool from '@supercharge/promise-pool';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  millisToNanos,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { UsersTotalResponse } from './dto/users-total.dto';
import { getDailyIntervals, getGrowth } from '../utils';

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
    const { contract, dao } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [
      usersCount,
      dayAgoUsersCount,
      avgCouncilSize,
      dayAgoAvgCouncilSize,
      interactions,
      dayAgoInteractions,
    ] = await Promise.all([
      this.transactionService.getUsersTotalCount(context),
      this.transactionService.getUsersTotalCount(context, {
        to: millisToNanos(dayAgo.valueOf()),
      }),
      this.daoStatsService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.CouncilSize,
        func: 'AVG',
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        dao,
        metric: DaoStatsMetric.CouncilSize,
        func: 'AVG',
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getUsersInteractionsCount(context),
      this.transactionService.getUsersInteractionsCount(context, {
        to: dayAgo.valueOf(),
      }),
    ]);

    return {
      users: {
        count: usersCount,
        growth: getGrowth(usersCount, dayAgoUsersCount),
      },
      council: {
        count: avgCouncilSize,
        growth: getGrowth(avgCouncilSize, dayAgoAvgCouncilSize),
      },
      // TODO
      interactions: {
        count: interactions,
        growth: getGrowth(interactions, dayAgoInteractions),
      },
    };
  }

  async users(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;
    const days = getDailyIntervals(from, to || moment().valueOf());

    // TODO: optimize day-by-day querying
    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getUsersTotalCountDaily(
          context,
          {
            to: end,
          },
        );

        return { ...qr?.[0], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

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

  async usersLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());

    const { results: byDays, errors } = await PromisePool.withConcurrency(5)
      .for(days)
      .process(async ({ start, end }) => {
        const qr = await this.transactionService.getUsersLeaderboard(context, {
          to: end,
        });

        return { usersCount: [...qr], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const [dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getUsersActivityQuery(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getUsersActivityQuery(context, {
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

  async council(
    contractContext: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract, dao } = contractContext as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.CouncilSize,
      func: 'AVG',
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

  async councilLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.CouncilSize,
      func: 'AVG',
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.CouncilSize,
            func: 'AVG',
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contract,
            dao,
            metric: DaoStatsMetric.CouncilSize,
            func: 'AVG',
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
    const metrics =
      await this.transactionService.getUsersInteractionsCountDaily(
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

  async interactionsLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());
    const dayAgo = moment().subtract(1, 'days');

    const [byDays, dayAgoActivity, totalActivity] = await Promise.all([
      this.transactionService.getUsersInteractionsCountLeaderboard(
        context,
        {
          from: weekAgo.valueOf(),
          to: moment().valueOf(),
        },
        true,
      ),
      this.transactionService.getUsersInteractionsCountLeaderboard(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getUsersInteractionsCountLeaderboard(context, {
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
}

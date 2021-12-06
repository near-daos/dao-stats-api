import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import PromisePool from '@supercharge/promise-pool';

import {
  Contract,
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
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<UsersTotalResponse> {
    const { contract, dao } = context as DaoContractContext;
    const usersCount = await this.transactionService.getUsersTotalCount(
      context,
    );

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoUsersCount = await this.transactionService.getUsersTotalCount(
      context,
      {
        from: null,
        to: millisToNanos(dayAgo.valueOf()),
      },
    );

    const avgCouncilSize = await this.daoStatsHistoryService.getValue({
      contract,
      dao,
      metric: DaoStatsMetric.CouncilSize,
      func: 'AVG',
    });
    const dayAgoAvgCouncilSize = await this.daoStatsHistoryService.getValue({
      contract,
      dao,
      metric: DaoStatsMetric.CouncilSize,
      func: 'AVG',
      to: dayAgo.valueOf(),
    });

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
        count: 0,
        growth: 0,
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
            from: null,
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
          from: null,
          to: end,
        });

        return { usersCount: [...qr], start, end };
      });

    if (errors && errors.length) {
      errors.map((error) => this.logger.error(error));
    }

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoActivity = await this.transactionService.getUsersActivityQuery(
      context,
      {
        from: null,
        to: dayAgo.valueOf(),
      },
    );

    const totalActivity = await this.transactionService.getUsersActivityQuery(
      context,
      { from: null, to: moment().valueOf() },
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
    contractContext: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract } = contractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
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
        const prevValue = await this.daoStatsHistoryService.getValue({
          contract,
          dao,
          metric: DaoStatsMetric.CouncilSize,
          func: 'AVG',
          to: dayAgo.valueOf(),
        });
        const history = await this.daoStatsHistoryService.getHistory({
          contract,
          dao,
          metric: DaoStatsMetric.CouncilSize,
          func: 'AVG',
          from: weekAgo.valueOf(),
        });

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
}

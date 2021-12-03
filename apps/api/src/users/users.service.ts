import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

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
import { getGrowth } from '../utils';

@Injectable()
export class UsersService {
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
      null,
      millisToNanos(dayAgo.valueOf()),
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
    };
  }

  async users(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    return this.transactionService.getUsersCountHistory(context, from, to);
  }

  async usersLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    return this.transactionService.getUsersLeaderboard(contract);
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

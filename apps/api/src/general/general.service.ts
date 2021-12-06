import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
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
  TransactionType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { getDailyIntervals, getGrowth } from '../utils';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);

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
  ): Promise<GeneralTotalResponse> {
    const { contract, dao } = context as DaoContractContext;

    const daoCount = await this.transactionService.getTotalCount(
      context,
      TransactionType.CreateDao,
    );

    const dayAgo = moment().subtract(1, 'days');

    const dayAgoDaoCount = await this.transactionService.getTotalCount(
      context,
      TransactionType.CreateDao,
      {
        from: null,
        to: dayAgo.valueOf(),
      },
    );

    const activity = await this.transactionService.getContractActivityCount(
      context,
    );
    const dayAgoActivity =
      await this.transactionService.getContractActivityCount(context, {
        from: null,
        to: dayAgo.valueOf(),
      });

    const groupsCount = await this.daoStatsService.getValue({
      contract,
      dao,
      metric: DaoStatsMetric.GroupsCount,
    });
    const dayAgoGroupsCount = await this.daoStatsHistoryService.getValue({
      contract,
      dao,
      metric: DaoStatsMetric.GroupsCount,
      to: dayAgo.valueOf(),
    });

    return {
      dao: {
        count: daoCount,
        growth: getGrowth(daoCount, dayAgoDaoCount),
      },
      activity: {
        count: activity,
        growth: getGrowth(activity, dayAgoActivity),
      },
      groups: {
        count: groupsCount,
        growth: getGrowth(groupsCount, dayAgoGroupsCount),
      },
    };
  }

  async daos(
    context: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getTotalCountDaily(
      context,
      TransactionType.CreateDao,
      {
        from: null,
        to: metricQuery.to,
      },
    );

    return {
      metrics: metrics.map(({ day, count }) => ({
        timestamp: moment(day).valueOf(),
        count,
      })),
    };
  }

  async activity(
    context: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const metrics = await this.transactionService.getContractActivityCountDaily(
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

  async activityLeaderboard(
    context: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = context;
    const weekAgo = moment().subtract(7, 'days');
    const days = getDailyIntervals(weekAgo.valueOf(), moment().valueOf());

    const byDays = await this.transactionService.getContractActivityLeaderboard(
      context,
      {
        from: weekAgo.valueOf(),
        to: moment().valueOf(),
      },
      true,
    );

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoActivity =
      await this.transactionService.getContractActivityLeaderboard(context, {
        from: null,
        to: dayAgo.valueOf(),
      });

    const totalActivity =
      await this.transactionService.getContractActivityLeaderboard(context, {
        from: null,
        to: moment().valueOf(),
      });

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
    contractContext: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract } = contractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      metric: DaoStatsMetric.GroupsCount,
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

  async groupsLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.GroupsCount,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const prevValue = await this.daoStatsHistoryService.getValue({
          contract,
          dao,
          metric: DaoStatsMetric.GroupsCount,
          to: dayAgo.valueOf(),
        });
        const history = await this.daoStatsHistoryService.getHistory({
          contract,
          dao,
          metric: DaoStatsMetric.GroupsCount,
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

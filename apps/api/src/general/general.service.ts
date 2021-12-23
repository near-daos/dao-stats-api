import moment from 'moment';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ContractContext,
  DaoContractContext,
  DaoStatsHistoryService,
  DaoStatsMetric,
  DaoStatsService,
  LeaderboardMetricResponse,
  MetricQuery,
  MetricResponse,
  MetricType,
  TransactionType,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { getDailyIntervals, getGrowth, patchMetricDays } from '../utils';

@Injectable()
export class GeneralService {
  private readonly logger = new Logger(GeneralService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsService: DaoStatsService,
    private readonly daoStatsHistoryService: DaoStatsHistoryService,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GeneralTotalResponse> {
    const { contractId: contract } = context as DaoContractContext;

    const dayAgo = moment().subtract(1, 'days');

    const [
      daoCount,
      dayAgoDaoCount,
      activity,
      dayAgoActivity,
      groupsCount,
      dayAgoGroupsCount,
      averageGroupsCount,
      dayAgoAverageGroupsCount,
    ] = await Promise.all([
      this.daoStatsService.getValue({
        contract,
        metric: DaoStatsMetric.DaoCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        metric: DaoStatsMetric.DaoCount,
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getContractActivityCount(context, {
        to: dayAgo.valueOf(),
      }),
      this.transactionService.getContractActivityCount(context),
      this.daoStatsService.getValue({
        contract,
        metric: DaoStatsMetric.GroupsCount,
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        metric: DaoStatsMetric.GroupsCount,
        to: dayAgo.valueOf(),
      }),
      this.daoStatsService.getValue({
        contract,
        metric: DaoStatsMetric.GroupsCount,
        func: 'AVG',
      }),
      this.daoStatsHistoryService.getValue({
        contract,
        metric: DaoStatsMetric.GroupsCount,
        to: dayAgo.valueOf(),
        func: 'AVG',
      }),
    ]);

    return {
      dao: {
        count: daoCount,
        growth: getGrowth(daoCount, dayAgoDaoCount),
      },
      activity: {
        count: activity.count,
        growth: getGrowth(activity.count, dayAgoActivity.count),
      },
      groups: {
        count: groupsCount,
        growth: getGrowth(groupsCount, dayAgoGroupsCount),
      },
      averageGroups: {
        count: averageGroupsCount,
        growth: getGrowth(averageGroupsCount, dayAgoAverageGroupsCount),
      },
    };
  }

  async daos(
    context: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contractId: contract } = context;

    const [daoCountHistory, metrics] = await Promise.all([
      this.daoStatsHistoryService.getHistory({
        contract,
        metric: DaoStatsMetric.DaoCount,
      }),
      this.transactionService.getTotalCountDaily(
        context,
        TransactionType.CreateDao,
        {
          to: metricQuery.to,
        },
      ),
    ]);

    return {
      metrics: patchMetricDays(
        metricQuery,
        metrics.map(({ day, count }) => ({
          timestamp: moment(day).valueOf(),
          count:
            daoCountHistory.find(({ date }) =>
              moment(date).isSame(moment(day), 'day'),
            )?.value || count,
        })),
        MetricType.Total,
      ),
    };
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
    contractContext: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contractId: contract, dao } = contractContext as DaoContractContext;
    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.GroupsCount,
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

  async groupsLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contractId: contract } = contractContext;

    const dayAgo = moment().subtract(1, 'day');
    const weekAgo = moment().subtract(1, 'week');

    const leaderboard = await this.daoStatsService.getLeaderboard({
      contract,
      metric: DaoStatsMetric.GroupsCount,
    });

    const metrics = await Promise.all(
      leaderboard.map(async ({ dao, value }) => {
        const [prevValue, history] = await Promise.all([
          this.daoStatsHistoryService.getValue({
            contract,
            dao,
            metric: DaoStatsMetric.GroupsCount,
            to: dayAgo.valueOf(),
          }),
          this.daoStatsHistoryService.getHistory({
            contract,
            dao,
            metric: DaoStatsMetric.GroupsCount,
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

  async averageGroups(
    contractContext: ContractContext | DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contractId: contract, dao } = contractContext as DaoContractContext;

    const { from, to } = metricQuery;

    const history = await this.daoStatsHistoryService.getHistory({
      contract,
      dao,
      metric: DaoStatsMetric.GroupsCount,
      from,
      to,
      func: 'AVG',
    });

    return {
      metrics: history.map((row) => ({
        timestamp: row.date.valueOf(),
        count: row.value,
      })),
    };
  }
}

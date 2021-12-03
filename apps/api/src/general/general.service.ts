import moment from 'moment';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { millisToNanos } from '@dao-stats/common/utils';
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
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { getGrowth } from '../utils';

@Injectable()
export class GeneralService {
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

    const daoCount = await this.transactionService.getContractTotalCount(
      context,
    );

    const dayAgo = moment().subtract(1, 'days');
    const today = new Date();

    const dayAgoDaoCount = await this.transactionService.getContractTotalCount(
      context,
      null,
      millisToNanos(dayAgo.valueOf()),
    );

    const activity =
      await this.transactionService.getContractActivityTotalCount(context);
    const dayAgoActivity =
      await this.transactionService.getContractActivityTotalCount(
        context,
        null,
        millisToNanos(dayAgo.valueOf()),
      );

    const groupsCount = await this.daoStatsHistoryService.getValue({
      contract,
      metric: DaoStatsMetric.GroupsCount,
      to: today.getTime(),
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
    contractContext: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract } = contractContext;
    const { from, to } = metricQuery;

    return this.transactionService.getDaoCountHistory(contract, from, to);
  }

  async activity(
    contractContext: ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { contract } = contractContext;
    const { from, to } = metricQuery;

    return this.transactionService.getDaoActivityHistory(contract, from, to);
  }

  async activityLeaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    return this.transactionService.getDaoActivityLeaderboard(contract);
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

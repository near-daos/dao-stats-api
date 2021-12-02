import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import {
  Contract,
  ContractContext,
  DaoContractContext,
  DAOStatsHistoryService,
  DAOStatsAggregationFunction,
  DAOStatsMetric,
  MetricQuery,
  MetricResponse,
  LeaderboardMetricResponse,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { getGrowth } from '../utils';

@Injectable()
export class GeneralService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,
    private readonly daoStatsHistoryService: DAOStatsHistoryService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<GeneralTotalResponse> {
    const daoCount = await this.transactionService.getContractTotalCount(
      context,
    );

    const today = new Date();
    const dayAgo = daysFromDate(today);

    const dayAgoDaoCount = await this.transactionService.getContractTotalCount(
      context,
      null,
      millisToNanos(dayAgo.getTime()),
    );

    const activity =
      await this.transactionService.getContractActivityTotalCount(context);
    const dayAgoActivity =
      await this.transactionService.getContractActivityTotalCount(
        context,
        null,
        millisToNanos(dayAgo.getTime()),
      );

    const groupsCount = await this.daoStatsHistoryService.getAggregationValue(
      context,
      DAOStatsAggregationFunction.Sum,
      DAOStatsMetric.GroupsCount,
      null,
      today.getTime(),
    );
    const dayAgoGroupsCount =
      await this.daoStatsHistoryService.getAggregationValue(
        context,
        DAOStatsAggregationFunction.Sum,
        DAOStatsMetric.GroupsCount,
        null,
        dayAgo.getTime(),
      );

    console.log({ groupsCount, dayAgoGroupsCount });

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
}

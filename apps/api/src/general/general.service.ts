import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import { Repository } from 'typeorm';
import { GeneralTotalResponse } from './dto/general-total.dto';
import { DAOStatsHistoryService } from '@dao-stats/common/dao-stats-history.service';
import {
  DAOStatsAggregationFunction,
  DAOStatsMetric,
} from '@dao-stats/common/types';
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

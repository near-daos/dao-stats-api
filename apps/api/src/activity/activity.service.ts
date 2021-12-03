import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { millisToNanos } from 'libs/common/utils';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';

import {
  Contract,
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricResponse,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { ActivityTotalResponse } from './dto/activity-total.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<ActivityTotalResponse> {
    const proposalsCount = await this.transactionService.getProposalsTotalCount(
      context,
    );

    const dayAgoProposalsCount =
      await this.transactionService.getProposalsTotalCount(
        context,
        millisToNanos(moment().subtract(1, 'days').valueOf()),
      );

    return {
      proposals: {
        count: proposalsCount,
        growth: Math.ceil(
          (dayAgoProposalsCount / (proposalsCount - dayAgoProposalsCount)) *
            100,
        ),
      },
    };
  }

  async totalsHistory(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    return this.transactionService.getProposalsCountHistory(context, from, to);
  }

  async leaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    return this.transactionService.getProposalsLeaderboard(contract);
  }
}

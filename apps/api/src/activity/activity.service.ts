import { millisToNanos } from '@dao-stats/astro/utils';
import { ContractContext } from '@dao-stats/common/dto/contract-context.dto';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { LeaderboardMetricResponse } from '@dao-stats/common/dto/leaderboard-metric-response.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
import moment from 'moment';
import { Repository } from 'typeorm';
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

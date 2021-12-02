import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';

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

    const today = new Date();
    const dayAgo = daysFromDate(today, -1);
    const dayAgoUsersCount = await this.transactionService.getUsersTotalCount(
      context,
      millisToNanos(dayAgo.getTime()),
    );

    return {
      proposals: {
        count: proposalsCount,
        growth: Math.ceil(
          (dayAgoUsersCount / (proposalsCount - dayAgoUsersCount)) * 100,
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
}

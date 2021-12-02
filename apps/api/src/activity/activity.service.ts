import { daysFromDate, millisToNanos } from '@dao-stats/astro/utils';
import { DaoContractContext } from '@dao-stats/common/dto/dao-contract-context.dto';
import { MetricQuery } from '@dao-stats/common/dto/metric-query.dto';
import { MetricResponse } from '@dao-stats/common/dto/metric-response.dto';
import { Contract } from '@dao-stats/common/entities';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionService } from 'libs/transaction/src';
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

  async totals(context: DaoContractContext): Promise<ActivityTotalResponse> {
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
    context: DaoContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    return this.transactionService.getProposalsCountHistory(context, from, to);
  }
}

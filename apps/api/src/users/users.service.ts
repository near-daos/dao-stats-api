import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { millisToNanos } from '@dao-stats/astro/utils';
import {
  Contract,
  ContractContext,
  DaoContractContext,
  MetricQuery,
  MetricResponse,
  LeaderboardMetricResponse,
} from '@dao-stats/common';
import { TransactionService } from '@dao-stats/transaction';
import { UsersTotalResponse } from './dto/users-total.dto';
import moment from 'moment';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly transactionService: TransactionService,

    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async totals(
    context: DaoContractContext | ContractContext,
  ): Promise<UsersTotalResponse> {
    const usersCount = await this.transactionService.getUsersTotalCount(
      context,
    );

    const dayAgo = moment().subtract(1, 'days');
    const dayAgoUsersCount = await this.transactionService.getUsersTotalCount(
      context,
      null,
      millisToNanos(dayAgo.valueOf()),
    );

    return {
      users: {
        count: usersCount,
        growth: Math.floor(
          ((usersCount - dayAgoUsersCount) / dayAgoUsersCount) * 100,
        ),
      },
    };
  }

  async totalsHistory(
    context: DaoContractContext | ContractContext,
    metricQuery: MetricQuery,
  ): Promise<MetricResponse> {
    const { from, to } = metricQuery;

    return this.transactionService.getUsersCountHistory(context, from, to);
  }

  async leaderboard(
    contractContext: ContractContext,
  ): Promise<LeaderboardMetricResponse> {
    const { contract } = contractContext;

    return this.transactionService.getUsersLeaderboard(contract);
  }
}

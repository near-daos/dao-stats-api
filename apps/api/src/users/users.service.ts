import { millisToNanos } from '@dao-stats/astro/utils';
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
